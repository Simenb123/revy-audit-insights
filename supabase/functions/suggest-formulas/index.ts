import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callOpenAI } from '../_shared/openai.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SuggestionRequest {
  clientId: string;
  industry?: string;
  companySize?: 'small' | 'medium' | 'large';
  analysisType?: 'basic' | 'comprehensive';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { clientId, industry, companySize, analysisType = 'basic' }: SuggestionRequest = await req.json()

    // Get client's chart of accounts
    const { data: accounts, error: accountsError } = await supabaseClient
      .from('accounts')
      .select('account_number, account_name, account_type, balance')
      .eq('client_id', clientId)

    if (accountsError) {
      throw accountsError
    }

    // Get existing formulas for context
    const { data: existingFormulas, error: formulasError } = await supabaseClient
      .from('formulas')
      .select('name, formula_expression')
      .limit(10)

    if (formulasError) {
      throw formulasError
    }

    const prompt = `
Du er en ekspert revisor og finansanalytiker. Analyser kontoplanen nedenfor og foreslå relevante KPI-formler.

Kontoinformasjon:
${accounts.map(acc => `${acc.account_number}: ${acc.account_name} (${acc.account_type}) - Saldo: ${acc.balance || 0}`).join('\n')}

Eksisterende formler (unngå duplikater):
${existingFormulas.map(f => `${f.name}: ${f.formula_expression}`).join('\n')}

Bransje: ${industry || 'Ukjent'}
Bedriftsstørrelse: ${companySize || 'Ukjent'}
Analysenivå: ${analysisType}

Lag ${analysisType === 'comprehensive' ? '8-12' : '4-6'} relevante KPI-forslag basert på tilgjengelige kontoer.

Returner JSON-format:
{
  "suggestions": [
    {
      "id": "unique_id",
      "name": "Formel navn",
      "description": "Kort beskrivelse av hva formelen måler",
      "formula": "MATEMATISK_FORMEL_MED_KONTONUMMER",
      "category": "profitability|liquidity|efficiency|leverage|growth",
      "confidence": 0.0-1.0,
      "reasoning": "Forklaring av hvorfor denne formelen er relevant",
      "accounts_needed": ["1000", "2000"]
    }
  ]
}

Regler:
- Bruk kun kontonummer som finnes i kontoplanen
- Formler må være matematisk gyldige (f.eks: (1000 + 1100) / 2000)
- Høy relevans for norske regnskapsstandarder
- Prioriter formler som gir innsikt i bedriftens ytelse
- Confidence basert på hvor godt kontoplanen passer formelen
`

    const response = await callOpenAI('chat/completions', {
      model: 'gpt-5-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'Du er en ekspert revisor som lager KPI-forslag basert på kontoplaner. Svar alltid i gyldig JSON-format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_completion_tokens: 2000
    })

    const suggestions = JSON.parse(response.choices[0].message.content)

    return new Response(
      JSON.stringify(suggestions),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in suggest-formulas function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        suggestions: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})