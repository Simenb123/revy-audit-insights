import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { client_id, period_key, file_name, payroll_data } = await req.json()

    if (!client_id || !period_key || !payroll_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract relevant data from A07 JSON structure (using correct paths)
    const extractedData = {
      period_key,
      file_name,
      orgnr: payroll_data.mottatt?.opplysningspliktig?.norskIdentifikator,
      navn: payroll_data.mottatt?.opplysningspliktig?.navn,
      avstemmingstidspunkt: payroll_data.mottatt?.avstemmingstidspunkt,
      fom_kalendermaaned: payroll_data.mottatt?.fomKalendermaaned,
      tom_kalendermaaned: payroll_data.mottatt?.tomKalendermaaned,
      antall_personer_innrapportert: payroll_data.mottatt?.oppgave?.oppsummerteVirksomheter?.antallPersonerInnrapportert?.antall,
      antall_personer_unike: payroll_data.mottatt?.oppgave?.oppsummerteVirksomheter?.antallPersonerInnrapportert?.unike
    }

    // Insert payroll import record
    const { data: importData, error: importError } = await supabase
      .from('payroll_imports')
      .insert({
        client_id,
        ...extractedData,
        created_by: req.headers.get('Authorization') ? undefined : null
      })
      .select()
      .single()

    if (importError) {
      console.error('Error inserting payroll import:', importError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payroll import' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const importId = importData.id

    // Store the complete raw JSON data
    const { data: rawDataRecord, error: rawDataError } = await supabase
      .from('payroll_raw_data')
      .insert({
        payroll_import_id: importId,
        raw_json: payroll_data,
        file_size: JSON.stringify(payroll_data).length
      })
      .select()
      .single()

    if (rawDataError) {
      console.error('Error inserting raw data:', rawDataError)
    }

    // Store detailed monthly submissions and related data
    const innsendinger = payroll_data.mottatt?.opplysningspliktig?.innsendinger || []
    for (const innsending of innsendinger) {
      if (!innsending.kalendermaaned) continue

      const [year, month] = innsending.kalendermaaned.split('-').map(Number)
      
      // Extract monthly amounts from mottattAvgiftOgTrekkTotalt
      const mottatt = innsending.mottattAvgiftOgTrekkTotalt || {}
      const sumArbeidsgiveravgift = mottatt.sumArbeidsgiveravgift || 0
      const sumForskuddstrekk = Math.abs(mottatt.sumForskuddstrekk || 0) // Make positive for display
      const sumFinansskatt = mottatt.sumFinansskattLoenn || 0
      const totalAmount = sumArbeidsgiveravgift + sumForskuddstrekk + sumFinansskatt
      
      // Insert monthly submission
      const { data: monthlySubmission, error: monthlyError } = await supabase
        .from('payroll_monthly_submissions')
        .insert({
          payroll_import_id: importId,
          period_year: year,
          period_month: month,
          submission_data: innsending,
          summary_data: {
            period: innsending.kalendermaaned,
            count: innsending.antallInntektsmottakere || 0,
            total_amount: totalAmount,
            bruttolonn: 0, // Will be calculated from virksomhet data later
            arbeidsgiveravgift: sumArbeidsgiveravgift,
            forskuddstrekk: sumForskuddstrekk,
            finansskatt: sumFinansskatt,
            status: innsending.status,
            kildesystem: innsending.kildesystem,
            mottatt_avgift_trekk: mottatt
          }
        })
        .select()
        .single()

      if (monthlyError) {
        console.error(`Error storing monthly data for ${innsending.kalendermaaned}:`, monthlyError)
        continue
      }

      // Store detailed submission information
      await supabase.from('payroll_submission_details').insert({
        payroll_import_id: importId,
        monthly_submission_id: monthlySubmission?.id,
        calendar_month: innsending.kalendermaaned,
        altinn_reference: innsending.altinnReferanse,
        submission_id: innsending.innsendingsId,
        message_id: innsending.meldingsId,
        status: innsending.status,
        delivery_time: innsending.leveringstidspunkt,
        altinn_timestamp: innsending.tidsstempelFraAltinn,
        source_system: innsending.kildesystem
      })

      // Store payment information
      const innbetalingInfo = innsending.innbetalingsinformasjon
      if (innbetalingInfo) {
        await supabase.from('payroll_payment_info').insert({
          payroll_import_id: importId,
          monthly_submission_id: monthlySubmission?.id,
          calendar_month: innsending.kalendermaaned,
          account_number: innbetalingInfo.kontonummer,
          kid_arbeidsgiveravgift: innbetalingInfo.kidForArbeidsgiveravgift,
          kid_forskuddstrekk: innbetalingInfo.kidForForskuddstrekk,
          kid_finansskatt: innbetalingInfo.kidForFinansskattLoenn,
          due_date: innbetalingInfo.forfallsdato
        })
      }
    }

    // Store employee data and income analysis from virksomhet structure
    console.log('Processing employee data from virksomhet structure...')
    const virksomheter = payroll_data.mottatt?.opplysningspliktig?.virksomhet || []
    console.log(`Found ${virksomheter.length} virksomheter`)
    
    // Also check alternative structure from oppgave 
    const oppgaveVirksomhet = payroll_data.mottatt?.oppgave?.virksomhet || []
    console.log(`Found ${oppgaveVirksomhet.length} virksomheter in oppgave structure`)
    
    // Use whichever has more data
    const allVirksomheter = virksomheter.length > 0 ? virksomheter : oppgaveVirksomhet
    console.log(`Using ${allVirksomheter.length} virksomheter for processing`)
    
    // Also check for inntekt array directly in oppsummerteVirksomheter
    const oppsummerteInntekt = payroll_data.mottatt?.oppgave?.oppsummerteVirksomheter?.inntekt || []
    console.log(`Found ${oppsummerteInntekt.length} income entries in oppsummerteVirksomheter`)
    
    // First, collect income by type for analysis and group employees by unique ID
    const incomeByTypeMap = new Map()
    const uniqueEmployees = new Map() // Map to store unique employees and their income entries
    
    // Collect all income entries grouped by employee
    for (const virksomhet of allVirksomheter) {
      console.log(`Processing virksomhet with ${virksomhet.inntektsmottaker?.length || 0} inntektsmottakere`)
      const inntektsmottakere = virksomhet.inntektsmottaker || []
      
      for (const mottaker of inntektsmottakere) {
        if (!mottaker.norskIdentifikator) continue

        const employeeId = mottaker.norskIdentifikator
        if (!uniqueEmployees.has(employeeId)) {
          uniqueEmployees.set(employeeId, {
            employee_data: {
              navn: mottaker.identifiserendeInformasjon?.navn || mottaker.navn,
              norskIdentifikator: mottaker.norskIdentifikator,
              arbeidsforhold: mottaker.arbeidsforhold || [],
              inntekt: [],
              forskuddstrekk: mottaker.forskuddstrekk || []
            },
            income_entries: []
          })
        }

        const employee = uniqueEmployees.get(employeeId)
        
        // Add all income entries for this employee
        const inntekter = mottaker.inntekt || []
        employee.employee_data.inntekt.push(...inntekter)
        employee.income_entries.push(...inntekter)
      }
    }

    // Process direct income entries from oppsummerteVirksomheter if available
    // These are usually aggregated income summaries, not individual employee data
    if (oppsummerteInntekt.length > 0 && uniqueEmployees.size === 0) {
      console.log(`Processing ${oppsummerteInntekt.length} direct income entries`)
      
      // Since these are summary entries without employee identifiers,
      // we need to find the actual employee data from elsewhere in the JSON
      const actualEmployees = new Set()
      
      // Look for employee identifiers in the complete structure
      const allVirksomheterData = payroll_data.mottatt?.opplysningspliktig?.virksomhet || []
      allVirksomheterData.forEach((virk: any) => {
        const mottakere = virk.inntektsmottaker || []
        mottakere.forEach((mottaker: any) => {
          if (mottaker.norskIdentifikator) {
            actualEmployees.add(mottaker.norskIdentifikator)
          }
        })
      })
      
      // If we still have no employees identified, create a single aggregate employee
      if (actualEmployees.size === 0) {
        const aggregateEmployeeId = 'aggregate-employee'
        uniqueEmployees.set(aggregateEmployeeId, {
          employee_data: {
            navn: extractedData.navn || 'Aggregert ansatt',
            norskIdentifikator: null,
            inntekt: [],
            arbeidsforhold: [],
            forskuddstrekk: []
          },
          income_entries: []
        })
        
        // Add all income entries to this aggregate employee
        for (const inntektEntry of oppsummerteInntekt) {
          if (!inntektEntry.beloep) continue
          
          const employee = uniqueEmployees.get(aggregateEmployeeId)
          employee.employee_data.inntekt.push(inntektEntry)
          employee.income_entries.push(inntektEntry)
        }
      }
    }

    console.log(`Found ${uniqueEmployees.size} unique employees`)

    // Now create employee records for each unique employee
    for (const [employeeId, employeeInfo] of uniqueEmployees) {
      // Insert employee record
      const { data: employeeRecord, error: employeeError } = await supabase
        .from('payroll_employees')
        .insert({
          payroll_import_id: importId,
          employee_id: employeeId,
          employee_data: employeeInfo.employee_data
        })
        .select()
        .single()

      if (employeeError) {
        console.error('Error storing employee data:', employeeError)
        continue
      }

      // Process all income entries for this employee
      for (const inntekt of employeeInfo.income_entries) {
        if (!inntekt.beloep) continue

        // Extract period from inntekt
        const periodeStart = inntekt.startdatoOpptjeningsperiode
        const periodYear = periodeStart ? new Date(periodeStart).getFullYear() : new Date().getFullYear()
        const periodMonth = periodeStart ? new Date(periodeStart).getMonth() + 1 : 1
        
        // Store individual income detail
        const { error: incomeError } = await supabase
          .from('payroll_income_details')
          .insert({
            payroll_employee_id: employeeRecord.id,
            income_type: inntekt.loennsinntekt?.beskrivelse || inntekt.beskrivelse || 'Ukjent',
            amount: parseFloat(inntekt.beloep) || 0,
            period_year: periodYear,
            period_month: periodMonth,
            details: inntekt
          })

        if (incomeError) {
          console.error('Error storing income details:', incomeError)
        }

        // Aggregate for income analysis
        const incomeType = inntekt.loennsinntekt?.beskrivelse || inntekt.beskrivelse || 'Ukjent'
        const calendarMonth = `${periodYear}-${String(periodMonth).padStart(2, '0')}`
        const key = `${incomeType}-${calendarMonth}`
        
        if (!incomeByTypeMap.has(key)) {
          incomeByTypeMap.set(key, {
            income_type: incomeType,
            calendar_month: calendarMonth,
            total_amount: 0,
            benefit_type: inntekt.fordel,
            triggers_aga: inntekt.utloeserArbeidsgiveravgift,
            subject_to_tax_withholding: inntekt.inngaarIGrunnlagForTrekk
          })
        }
        
        const existing = incomeByTypeMap.get(key)
        existing.total_amount += parseFloat(inntekt.beloep) || 0
      }
    }

    // Store aggregated income by type
    for (const incomeData of incomeByTypeMap.values()) {
      await supabase.from('payroll_income_by_type').insert({
        payroll_import_id: importId,
        ...incomeData,
        income_description: incomeData.income_type
      })
    }

    // Process and store payroll variables using correct A07 structure
    const variables = []
    
    // Extract data from the correct structure
    const oppgave = payroll_data.mottatt?.oppgave
    const oppsummerte = oppgave?.oppsummerteVirksomheter
    const betalingsinfo = oppgave?.betalingsinformasjon
    // Use existing innsendinger variable declared earlier
    
    if (oppsummerte) {
      // Calculate unique income recipients from virksomhet structure
      const uniqueEmployees = new Set()
      let totalBruttolonn = 0
      let totalForskuddstrekk = 0
      let totalArbeidsgiveravgift = 0
      
      // Count unique employees and calculate total gross salary from virksomhet
      const virksomheter = oppgave?.virksomhet || []
      virksomheter.forEach((virksomhet: any) => {
        const inntektsmottakere = virksomhet.inntektsmottaker || []
        inntektsmottakere.forEach((mottaker: any) => {
          if (mottaker.norskIdentifikator) {
            uniqueEmployees.add(mottaker.norskIdentifikator)
            
            // Sum all income for this employee
            const inntekter = mottaker.inntekt || []
            inntekter.forEach((inntekt: any) => {
              if (inntekt.beloep && inntekt.beloep > 0) {
                totalBruttolonn += parseFloat(inntekt.beloep)
              }
            })
          }
        })
      })
      
      // Sum up totals from monthly submissions for taxes and contributions
      innsendinger.forEach((innsending: any) => {
        const mottatt = innsending.mottattAvgiftOgTrekkTotalt
        if (mottatt) {
          totalForskuddstrekk += mottatt.sumForskuddstrekk || 0
          totalArbeidsgiveravgift += mottatt.sumArbeidsgiveravgift || 0
        }
      })
      
      const totalInntektsmottakere = uniqueEmployees.size
      
      variables.push(
        { name: 'antall.virksomheter', value: oppgave?.virksomhet?.length || 1 },
        { name: 'antall.mottakere', value: totalInntektsmottakere },
        { name: 'sum.bruttolonn', value: totalBruttolonn },
        { name: 'sum.forskuddstrekk.person', value: oppsummerte.forskuddstrekk?.reduce((sum: number, f: any) => sum + Math.abs(f.beloep || 0), 0) || 0 },
        { name: 'sum.forskuddstrekk.innsendinger', value: totalForskuddstrekk },
        { name: 'sum.aga.innsendinger', value: totalArbeidsgiveravgift },
        { name: 'opp.sum.antallPersonerInnrapportert', value: oppsummerte.antallPersonerInnrapportert?.antall || 0 },
        { name: 'opp.sum.antallPersonerUnike', value: oppsummerte.antallPersonerInnrapportert?.unike || 0 }
      )

      // Process AGA by zone if available
      if (oppsummerte.arbeidsgiveravgift?.loennOgGodtgjoerelse) {
        const agaSoner: { [key: string]: any } = {}
        oppsummerte.arbeidsgiveravgift.loennOgGodtgjoerelse.forEach((aga: any) => {
          agaSoner[aga.sone] = {
            grunnlag: aga.avgiftsgrunnlagBeloep || 0,
            sats: aga.prosentsats || 0,
            belop: Math.round((aga.avgiftsgrunnlagBeloep || 0) * (aga.prosentsats || 0) / 100)
          }
        })
        variables.push({
          name: 'aga.soner',
          value: agaSoner
        })
      }

      // Extract employment relationships from first virksomhet
      if (oppgave?.virksomhet?.[0]?.inntektsmottaker?.[0]?.arbeidsforhold) {
        const af = oppgave.virksomhet[0].inntektsmottaker[0].arbeidsforhold[0]
        variables.push(
          { name: 'antall.af.aktive', value: af ? 1 : 0 },
          { name: 'antall.af.nye', value: 0 }, // Would need more logic to determine
          { name: 'antall.af.sluttede', value: 0 } // Would need more logic to determine
        )
      }
      
      // Store monthly submissions data
      variables.push({
        name: 'innsendinger.detaljer',
        value: innsendinger.map((i: any) => ({
          maaned: i.kalendermaaned,
          leveringstidspunkt: i.leveringstidspunkt,
          status: i.status,
          antallInntektsmottakere: i.antallInntektsmottakere,
          kildesystem: i.kildesystem
        }))
      })
    }

    // Insert variables
    if (variables.length > 0) {
      const variableInserts = variables.map(v => ({
        import_id: importData.id,
        name: v.name,
        value: JSON.stringify(v.value)
      }))

      const { error: variableError } = await supabase
        .from('payroll_variables')
        .insert(variableInserts)

      if (variableError) {
        console.error('Error inserting payroll variables:', variableError)
        // Continue anyway - the import record is already created
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        import_id: importData.id,
        variables_count: variables.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing payroll import:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})