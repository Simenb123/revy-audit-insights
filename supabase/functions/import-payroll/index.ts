import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface PayrollData {
  client_id: string
  period_key: string
  file_name?: string
  payroll_data: any
}

// Helper functions
const toNum = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const parseDate = (s?: string): Date | undefined => s ? new Date(s) : undefined;

const inPeriod = (fom?: string, tom?: string, start?: string, slutt?: string): boolean => {
  if (!fom && !tom) return true;
  const pF = fom ? new Date(fom) : undefined;
  const pT = tom ? new Date(tom) : undefined;
  const s = start ? new Date(start) : undefined;
  const e = slutt ? new Date(slutt) : undefined;
  if (pF && e && e < pF) return false;
  if (pT && s && s > pT) return false;
  return true;
};

async function putVariable(importId: string, name: string, value: any) {
  const val = typeof value === "string" ? value : JSON.stringify(value);
  
  // Upsert variable
  const { error } = await supabase
    .from('payroll_variables')
    .upsert({ 
      import_id: importId, 
      name, 
      value: val 
    }, { 
      onConflict: 'import_id,name' 
    })
  
  if (error) throw error
}

async function importPayrollData(data: PayrollData, userId?: string) {
  const { client_id, period_key, file_name, payroll_data } = data
  
  // Parse and validate the JSON structure
  const root = payroll_data?.mottatt ?? {}
  const oppgave: any = root.oppgave ?? {}
  const oppVirks: any = oppgave?.oppsummerteVirksomheter ?? {}
  
  // Create the main import record
  const { data: importRecord, error: importError } = await supabase
    .from('payroll_imports')
    .upsert({
      client_id,
      period_key,
      file_name,
      avstemmingstidspunkt: root.avstemmingstidspunkt,
      fom_kalendermaaned: root.fomKalendermaaned,
      tom_kalendermaaned: root.tomKalendermaaned,
      orgnr: root?.opplysningspliktig?.norskIdentifikator,
      navn: root?.opplysningspliktig?.navn,
      antall_personer_innrapportert: toNum(oppVirks?.antallPersonerInnrapportert?.antall),
      antall_personer_unike: toNum(oppVirks?.antallPersonerInnrapportert?.unike),
      created_by: userId
    }, {
      onConflict: 'client_id,period_key'
    })
    .select()
    .single()
  
  if (importError) throw importError
  const importId = importRecord.id
  
  // Delete existing data for this import
  await Promise.all([
    supabase.from('payroll_submissions').delete().eq('import_id', importId),
    supabase.from('payroll_companies').delete().eq('import_id', importId),
    supabase.from('payroll_recipients').delete().eq('import_id', importId),
    supabase.from('payroll_employments').delete().eq('import_id', importId),
    supabase.from('payroll_leaves').delete().eq('import_id', importId),
    supabase.from('payroll_income').delete().eq('import_id', importId),
    supabase.from('payroll_tax_deductions').delete().eq('import_id', importId),
    supabase.from('payroll_deductions').delete().eq('import_id', importId),
    supabase.from('payroll_employer_contributions').delete().eq('import_id', importId),
    supabase.from('payroll_pensions').delete().eq('import_id', importId),
    supabase.from('payroll_variables').delete().eq('import_id', importId)
  ])
  
  // Insert submissions
  const submissions = root?.opplysningspliktig?.innsendinger ?? []
  for (const x of submissions) {
    await supabase.from('payroll_submissions').insert({
      import_id: importId,
      kalendermaaned: x.kalendermaaned,
      status: x.status,
      kildesystem: x.kildesystem,
      altinn_referanse: x.altinnReferanse,
      innsendings_id: x.innsendingsId,
      meldings_id: x.meldingsId,
      leveringstidspunkt: x.leveringstidspunkt,
      tidsstempel_fra_altinn: x.tidsstempelFraAltinn,
      antall_inntektsmottakere: toNum(x.antallInntektsmottakere),
      sum_aga: toNum(x?.mottattAvgiftOgTrekkTotalt?.sumArbeidsgiveravgift),
      sum_forskuddstrekk: toNum(x?.mottattAvgiftOgTrekkTotalt?.sumForskuddstrekk),
      kontonummer: x?.innbetalingsinformasjon?.kontonummer,
      kid_aga: x?.innbetalingsinformasjon?.kidForArbeidsgiveravgift,
      kid_trekk: x?.innbetalingsinformasjon?.kidForForskuddstrekk,
      kid_finansskatt: x?.innbetalingsinformasjon?.kidForFinansskattLoenn,
      forfallsdato: x?.innbetalingsinformasjon?.forfallsdato
    })
  }
  
  // Insert AGA data
  const aga = oppVirks?.arbeidsgiveravgift ?? {}
  
  // Process loenn
  for (const row of aga?.loennOgGodtgjoerelse ?? []) {
    await supabase.from('payroll_employer_contributions').insert({
      import_id: importId,
      type: 'loenn',
      sone: String(row.sone ?? 'Ukjent'),
      beregningskode: row.beregningskodeForArbeidsgiveravgift,
      grunnlag: toNum(row.avgiftsgrunnlagBeloep),
      prosentsats: row.prosentsats != null ? toNum(row.prosentsats) : null
    })
  }
  
  // Process pensjon
  for (const row of aga?.tilskuddOgPremieTilPensjon ?? []) {
    await supabase.from('payroll_employer_contributions').insert({
      import_id: importId,
      type: 'pensjon',
      sone: String(row.sone ?? 'Ukjent'),
      beregningskode: row.beregningskodeForArbeidsgiveravgift,
      grunnlag: toNum(row.avgiftsgrunnlagBeloep),
      prosentsats: row.prosentsats != null ? toNum(row.prosentsats) : null
    })
  }
  
  // Process fradrag
  for (const row of aga?.fradragIGrunnlagetForSone ?? []) {
    await supabase.from('payroll_employer_contributions').insert({
      import_id: importId,
      type: 'fradragSone',
      sone: String(row.sone ?? 'Ukjent'),
      beregningskode: row.beregningskodeForArbeidsgiveravgift,
      grunnlag: toNum(row.avgiftsgrunnlagBeloep),
      prosentsats: row.prosentsatsForAvgiftsberegning != null ? toNum(row.prosentsatsForAvgiftsberegning) : null
    })
  }
  
  // Insert pension data
  for (const p of oppgave?.pensjonsinnretning ?? []) {
    await supabase.from('payroll_pensions').insert({
      import_id: importId,
      identifikator: p.identifikator
    })
  }
  
  // Process companies and their employees
  for (const v of oppgave?.virksomhet ?? []) {
    const { data: company } = await supabase
      .from('payroll_companies')
      .insert({
        import_id: importId,
        orgnr: v.norskIdentifikator,
        navn: v.navn
      })
      .select('id')
      .single()
    
    if (!company) continue
    const companyId = company.id
    
    // Process employees for this company
    for (const mot of v?.inntektsmottaker ?? []) {
      const info = mot?.identifiserendeInformasjon ?? {}
      
      const { data: recipient } = await supabase
        .from('payroll_recipients')
        .insert({
          import_id: importId,
          company_id: companyId,
          ansattnummer: info.ansattnummer,
          foedselsdato: info.foedselsdato,
          navn: info.navn
        })
        .select('id')
        .single()
      
      if (!recipient) continue
      const recipientId = recipient.id
      
      // Process employments
      for (const af of mot?.arbeidsforhold ?? []) {
        const { data: employment } = await supabase
          .from('payroll_employments')
          .insert({
            import_id: importId,
            recipient_id: recipientId,
            type: af.typeArbeidsforhold,
            startdato: af.startdato,
            sluttdato: af.sluttdato,
            stillingsprosent: af.stillingsprosent != null ? toNum(af.stillingsprosent) : null
          })
          .select('id')
          .single()
        
        if (!employment) continue
        const employmentId = employment.id
        
        // Process leaves
        for (const p of af?.permisjon ?? []) {
          await supabase.from('payroll_leaves').insert({
            import_id: importId,
            employment_id: employmentId,
            beskrivelse: p.beskrivelse,
            start_dato: p.startDato,
            slutt_dato: p.sluttDato
          })
        }
      }
      
      // Process income
      for (const it of mot?.inntekt ?? []) {
        await supabase.from('payroll_income').insert({
          import_id: importId,
          recipient_id: recipientId,
          beloep: toNum(it.beloep),
          fordel: it.fordel,
          trekkpliktig: Boolean(it.inngaarIGrunnlagForTrekk),
          aga_pliktig: Boolean(it.utloeserArbeidsgiveravgift),
          beskrivelse: it?.loennsinntekt?.beskrivelse,
          antall: it?.loennsinntekt?.antall != null ? toNum(it.loennsinntekt.antall) : null
        })
      }
      
      // Process tax deductions
      for (const ft of mot?.forskuddstrekk ?? []) {
        await supabase.from('payroll_tax_deductions').insert({
          import_id: importId,
          recipient_id: recipientId,
          beloep: toNum(ft.beloep)
        })
      }
      
      // Process deductions
      for (const fr of mot?.fradrag ?? []) {
        await supabase.from('payroll_deductions').insert({
          import_id: importId,
          recipient_id: recipientId,
          beskrivelse: fr.beskrivelse,
          beloep: toNum(fr.beloep)
        })
      }
    }
  }
  
  // Now calculate and store variables
  await calculateVariables(importId, root.fomKalendermaaned, root.tomKalendermaaned)
  
  return { import_id: importId, success: true }
}

async function calculateVariables(importId: string, fom?: string, tom?: string) {
  // Fetch all the data we need for calculations
  const [
    { data: companies },
    { data: recipients },
    { data: income },
    { data: taxDeductions },
    { data: submissions },
    { data: employments },
    { data: agaRows }
  ] = await Promise.all([
    supabase.from('payroll_companies').select('*').eq('import_id', importId),
    supabase.from('payroll_recipients').select('*').eq('import_id', importId),
    supabase.from('payroll_income').select('*').eq('import_id', importId),
    supabase.from('payroll_tax_deductions').select('*').eq('import_id', importId),
    supabase.from('payroll_submissions').select('*').eq('import_id', importId),
    supabase.from('payroll_employments').select('*').eq('import_id', importId),
    supabase.from('payroll_employer_contributions').select('*').eq('import_id', importId)
  ])
  
  // Calculate totals
  const sumNum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const bruttolonn = sumNum((income || []).map((i) => i.beloep || 0))
  const sumTrekkPerson = sumNum((taxDeductions || []).map((t) => t.beloep || 0))
  const sumTrekkInnsendinger = sumNum((submissions || []).map((x) => x.sum_forskuddstrekk || 0))
  const sumAGAI = sumNum((submissions || []).map((x) => x.sum_aga || 0))
  
  const trekkpliktig = sumNum((income || []).filter((i) => i.trekkpliktig).map((i) => i.beloep || 0))
  const ikkeTrekk = bruttolonn - trekkpliktig
  
  const agaPliktigFraLinjer = sumNum((income || []).filter((i) => i.aga_pliktig).map((i) => i.beloep || 0))
  
  // Calculate AGA per zone
  const agaPerSone: Record<string, { grunnlag: number; sats?: number | null; belop?: number }> = {}
  for (const r of (agaRows || []).filter(r => r.type !== 'fradragSone')) {
    const key = r.sone || 'Ukjent'
    agaPerSone[key] ??= { grunnlag: 0, sats: r.prosentsats ?? null }
    agaPerSone[key].grunnlag += r.grunnlag || 0
    if (r.prosentsats != null) agaPerSone[key].sats = r.prosentsats
  }
  
  for (const [s, v] of Object.entries(agaPerSone)) {
    v.belop = v.sats != null ? v.grunnlag * (v.sats / 100) : undefined
  }
  
  // Calculate employment statistics
  const aktive = (employments || []).filter((x) => inPeriod(fom, tom, x.startdato, x.sluttdato)).length
  const nye = (employments || [])
    .filter((x) => {
      if (!fom || !x.startdato) return false
      const sd = parseDate(x.startdato)!
      return sd >= new Date(fom) && (!tom || sd <= new Date(tom))
    })
    .length
  const sluttede = (employments || [])
    .filter((x) => {
      if (!tom || !x.sluttdato) return false
      const ed = parseDate(x.sluttdato)!
      return ed <= new Date(tom) && (!fom || ed >= new Date(fom))
    })
    .length
  
  // Store all variables
  await Promise.all([
    putVariable(importId, 'sum.bruttolonn', bruttolonn),
    putVariable(importId, 'sum.trekkpliktig', trekkpliktig),
    putVariable(importId, 'sum.ikkeTrekkpliktig', ikkeTrekk),
    putVariable(importId, 'sum.forskuddstrekk.person', sumTrekkPerson),
    putVariable(importId, 'sum.forskuddstrekk.innsendinger', sumTrekkInnsendinger),
    putVariable(importId, 'sum.aga.innsendinger', sumAGAI),
    putVariable(importId, 'aga.grunnlagFraInntektslinjer', agaPliktigFraLinjer),
    putVariable(importId, 'aga.soner', agaPerSone),
    putVariable(importId, 'antall.virksomheter', (companies || []).length),
    putVariable(importId, 'antall.mottakere', (recipients || []).length),
    putVariable(importId, 'antall.af.aktive', aktive),
    putVariable(importId, 'antall.af.nye', nye),
    putVariable(importId, 'antall.af.sluttede', sluttede)
  ])
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const body = await req.json()
    const result = await importPayrollData(body, user.id)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error importing payroll data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})