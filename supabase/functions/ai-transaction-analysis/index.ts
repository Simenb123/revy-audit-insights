import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  clientId: string;
  versionId: string;
  analysisType?: string;
  maxTransactions?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { clientId, versionId, analysisType = 'comprehensive', maxTransactions = 1000 }: AnalysisRequest = await req.json();

    console.log('🧠 Starting AI transaction analysis for:', { clientId, versionId, analysisType });

    // Fetch transaction data
    const { data: transactions, error: transactionError } = await supabaseClient
      .from('general_ledger_transactions')
      .select(`
        transaction_date,
        debit_amount,
        credit_amount,
        balance_amount,
        description,
        voucher_number,
        client_chart_of_accounts(account_number, account_name)
      `)
      .eq('client_id', clientId)
      .eq('version_id', versionId)
      .order('transaction_date', { ascending: false })
      .limit(maxTransactions);

    if (transactionError) {
      console.error('Transaction fetch error:', transactionError);
      throw new Error(`Failed to fetch transactions: ${transactionError.message}`);
    }

    if (!transactions || transactions.length === 0) {
      throw new Error('No transaction data found for analysis');
    }

    console.log(`📊 Found ${transactions.length} transactions for AI analysis`);

    // Prepare data for OpenAI analysis (reduce payload size)
    const analysisData = transactions.slice(0, 100).map(t => ({
      date: t.transaction_date,
      amount: t.debit_amount || t.credit_amount || 0,
      description: t.description?.substring(0, 50), // Shorter descriptions
      account: t.client_chart_of_accounts?.account_number,
      voucher: t.voucher_number
    }));

    // Create AI analysis prompt (shorter and more focused)
    const prompt = `Analyser følgende ${analysisData.length} regnskapstransaksjoner.

Transaksjonsdata:
${JSON.stringify(analysisData.slice(0, 20))}

Gi en kort analyse på norsk med:
1. Sammendrag av funn (maks 200 ord)
2. 3-5 identifiserte risikoområder
3. 3-5 anbefalte revisjonshandlinger
4. Konfidensnivå (1-10)

Svar kun med gyldig JSON i dette formatet:
{
  "sammendrag": "...",
  "risikoområder": ["...", "..."],
  "anbefalinger": ["...", "..."],
  "konfidensnivå": 8
}`;

    console.log('🤖 Sending request to OpenAI...');

    // Call OpenAI API with working model
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use working model
        messages: [
          {
            role: 'system',
            content: 'Du er en erfaren revisor som analyserer regnskapstransaksjoner. Gi alltid svar som gyldig JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('✅ OpenAI response received');

    let analysisResult;
    try {
      // Try to parse the OpenAI response as JSON
      const aiContent = openAIData.choices?.[0]?.message?.content;
      if (!aiContent) {
        throw new Error('No content in OpenAI response');
      }

      console.log('Raw AI content:', aiContent);

      // Attempt to parse as JSON, with fallback handling
      try {
        analysisResult = JSON.parse(aiContent);
      } catch (parseError) {
        console.warn('Failed to parse OpenAI response as JSON, creating fallback:', parseError);
        // Create a structured fallback response
        analysisResult = {
          sammendrag: aiContent.substring(0, 300),
          risikoområder: ['Kunne ikke parse full AI-respons', 'Manuell gjennomgang anbefales'],
          anbefalinger: ['Gjennomgå AI-analyse manuelt', 'Kontroller dataformat'],
          konfidensnivå: 5,
          feilmelding: 'AI-respons kunne ikke parses som JSON'
        };
      }
    } catch (error) {
      console.error('Error processing OpenAI response:', error);
      analysisResult = {
        sammendrag: 'AI-analyse feilet på grunn av teknisk feil',
        risikoområder: ['Teknisk feil i AI-behandling'],
        anbefalinger: ['Kontakt systemadministrator', 'Prøv igjen senere'],
        konfidensnivå: 1,
        feilmelding: error.message
      };
    }

    // Add metadata to the result
    const finalResult = {
      ...analysisResult,
      metadata: {
        analysisDate: new Date().toISOString(),
        transactionCount: transactions.length,
        clientId,
        versionId,
        analysisType,
        model: 'gpt-4o'
      }
    };

    console.log('🎯 AI analysis completed successfully');

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ AI transaction analysis failed:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      sammendrag: 'Analyse feilet på grunn av teknisk feil',
      risikoområder: ['Systemfeil', 'API-kommunikasjonsfeil'],
      anbefalinger: ['Prøv igjen senere', 'Kontakt support hvis problemet vedvarer'],
      konfidensnivå: 0,
      metadata: {
        analysisDate: new Date().toISOString(),
        error: true
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});