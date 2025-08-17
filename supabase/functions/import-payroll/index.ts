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

    // Extract relevant data from A07 JSON structure
    const extractedData = {
      period_key,
      file_name,
      orgnr: payroll_data.innsendingsopplysninger?.organisasjonsnummer,
      navn: payroll_data.innsendingsopplysninger?.organisasjonsnavn,
      avstemmingstidspunkt: payroll_data.oppgave?.avstemmingstidspunkt,
      fom_kalendermaaned: payroll_data.oppgave?.fomKalenderMaaned,
      tom_kalendermaaned: payroll_data.oppgave?.tomKalenderMaaned,
      antall_personer_innrapportert: payroll_data.oppgaveSammendrag?.antallPersonerInnrapportert,
      antall_personer_unike: payroll_data.oppgaveSammendrag?.antallPersonerUnike
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

    // Process and store payroll variables
    const variables = []
    
    // Extract key variables from the payroll data
    if (payroll_data.oppgaveSammendrag) {
      const sammendrag = payroll_data.oppgaveSammendrag
      
      variables.push(
        { name: 'antall.virksomheter', value: sammendrag.antallVirksomheter || 0 },
        { name: 'antall.mottakere', value: sammendrag.antallInntektsmottakere || 0 },
        { name: 'sum.bruttolonn', value: sammendrag.sumBruttolonn || 0 },
        { name: 'sum.forskuddstrekk.person', value: sammendrag.sumForskuddstrekkPerson || 0 },
        { name: 'sum.forskuddstrekk.innsendinger', value: sammendrag.sumForskuddstrekkInnsendinger || 0 },
        { name: 'sum.aga.innsendinger', value: sammendrag.sumArbeidsgiveravgiftInnsendinger || 0 },
        { name: 'opp.sum.antallPersonerInnrapportert', value: sammendrag.antallPersonerInnrapportert || 0 },
        { name: 'opp.sum.antallPersonerUnike', value: sammendrag.antallPersonerUnike || 0 }
      )

      // Process AGA by zone if available
      if (sammendrag.arbeidsgiveravgiftSoner) {
        variables.push({
          name: 'aga.soner',
          value: sammendrag.arbeidsgiveravgiftSoner
        })
      }

      // Process employment relationships if available
      if (sammendrag.arbeidsforholdSammendrag) {
        const af = sammendrag.arbeidsforholdSammendrag
        variables.push(
          { name: 'antall.af.aktive', value: af.antallAktiveIPerioden || 0 },
          { name: 'antall.af.nye', value: af.antallNyeIPerioden || 0 },
          { name: 'antall.af.sluttede', value: af.antallSluttedePerioden || 0 }
        )
      }
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