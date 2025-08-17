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

    // Process and store payroll variables using correct A07 structure
    const variables = []
    
    // Extract data from the correct structure
    const oppgave = payroll_data.mottatt?.oppgave
    const oppsummerte = oppgave?.oppsummerteVirksomheter
    const betalingsinfo = oppgave?.betalingsinformasjon
    const innsendinger = payroll_data.mottatt?.opplysningspliktig?.innsendinger || []
    
    if (oppsummerte) {
      // Calculate totals from innsendinger
      let totalInntektsmottakere = 0
      let totalBruttolonn = 0
      let totalForskuddstrekk = 0
      let totalArbeidsgiveravgift = 0
      
      // Sum up from monthly submissions
      innsendinger.forEach(innsending => {
        totalInntektsmottakere += innsending.antallInntektsmottakere || 0
        const mottatt = innsending.mottattAvgiftOgTrekkTotalt
        if (mottatt) {
          totalForskuddstrekk += mottatt.sumForskuddstrekk || 0
          totalArbeidsgiveravgift += mottatt.sumArbeidsgiveravgift || 0
        }
      })
      
      // Extract from inntekt array to calculate bruttolønn
      if (oppsummerte.inntekt) {
        oppsummerte.inntekt.forEach(inntekt => {
          if (inntekt.beloep && inntekt.beloep > 0) {
            totalBruttolonn += inntekt.beloep
          }
        })
      }
      
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