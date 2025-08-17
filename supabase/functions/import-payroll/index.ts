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

    // Store detailed monthly submissions
    const innsendinger = payroll_data.mottatt?.opplysningspliktig?.innsendinger || []
    for (const innsending of innsendinger) {
      if (!innsending.kalendermaaned) continue

      const [year, month] = innsending.kalendermaaned.split('-').map(Number)
      
      // Calculate total amount from mottattAvgiftOgTrekkTotalt
      const mottatt = innsending.mottattAvgiftOgTrekkTotalt || {}
      const totalAmount = (mottatt.sumForskuddstrekk || 0) + (mottatt.sumArbeidsgiveravgift || 0)
      
      const { error: monthlyError } = await supabase
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
            status: innsending.status,
            kildesystem: innsending.kildesystem,
            mottatt_avgift_trekk: mottatt
          }
        })

      if (monthlyError) {
        console.error(`Error storing monthly data for ${innsending.kalendermaaned}:`, monthlyError)
      }
    }

    // Store employee data from virksomhet structure
    const virksomheter = payroll_data.mottatt?.oppgave?.virksomhet || []
    for (const virksomhet of virksomheter) {
      const inntektsmottakere = virksomhet.inntektsmottaker || []
      
      for (const mottaker of inntektsmottakere) {
        if (!mottaker.norskIdentifikator) continue

        // Insert employee record
        const { data: employeeRecord, error: employeeError } = await supabase
          .from('payroll_employees')
          .insert({
            payroll_import_id: importId,
            employee_id: mottaker.norskIdentifikator,
            employee_data: {
              navn: mottaker.navn,
              norskIdentifikator: mottaker.norskIdentifikator,
              arbeidsforhold: mottaker.arbeidsforhold || [],
              inntekt: mottaker.inntekt || [],
              forskuddstrekk: mottaker.forskuddstrekk || []
            }
          })
          .select()
          .single()

        if (employeeError) {
          console.error('Error storing employee data:', employeeError)
          continue
        }

        // Store income details for this employee
        const inntekter = mottaker.inntekt || []
        for (const inntekt of inntekter) {
          if (!inntekt.periode || !inntekt.beloep) continue

          const [year, month] = inntekt.periode.split('-').map(Number)
          
          const { error: incomeError } = await supabase
            .from('payroll_income_details')
            .insert({
              payroll_employee_id: employeeRecord.id,
              income_type: inntekt.beskrivelse || 'Ukjent',
              amount: parseFloat(inntekt.beloep) || 0,
              period_year: year,
              period_month: month,
              details: inntekt
            })

          if (incomeError) {
            console.error('Error storing income details:', incomeError)
          }
        }
      }
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
      virksomheter.forEach(virksomhet => {
        const inntektsmottakere = virksomhet.inntektsmottaker || []
        inntektsmottakere.forEach(mottaker => {
          if (mottaker.norskIdentifikator) {
            uniqueEmployees.add(mottaker.norskIdentifikator)
            
            // Sum all income for this employee
            const inntekter = mottaker.inntekt || []
            inntekter.forEach(inntekt => {
              if (inntekt.beloep && inntekt.beloep > 0) {
                totalBruttolonn += parseFloat(inntekt.beloep)
              }
            })
          }
        })
      })
      
      // Sum up totals from monthly submissions for taxes and contributions
      innsendinger.forEach(innsending => {
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
        { name: 'sum.forskuddstrekk.person', value: oppsummerte.forskuddstrekk?.reduce((sum, f) => sum + Math.abs(f.beloep || 0), 0) || 0 },
        { name: 'sum.forskuddstrekk.innsendinger', value: totalForskuddstrekk },
        { name: 'sum.aga.innsendinger', value: totalArbeidsgiveravgift },
        { name: 'opp.sum.antallPersonerInnrapportert', value: oppsummerte.antallPersonerInnrapportert?.antall || 0 },
        { name: 'opp.sum.antallPersonerUnike', value: oppsummerte.antallPersonerInnrapportert?.unike || 0 }
      )

      // Process AGA by zone if available
      if (oppsummerte.arbeidsgiveravgift?.loennOgGodtgjoerelse) {
        const agaSoner = {}
        oppsummerte.arbeidsgiveravgift.loennOgGodtgjoerelse.forEach(aga => {
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
        value: innsendinger.map(i => ({
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