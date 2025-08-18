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
    const analysisData = transactions.slice(0, 500).map(t => ({
      date: t.transaction_date,
      amount: t.debit_amount || t.credit_amount || 0,
      description: t.description?.substring(0, 100), // Truncate descriptions
      account: t.client_chart_of_accounts?.account_number,
      voucher: t.voucher_number
    }));

    // Create AI analysis prompt
    const prompt = `
Analyser følgende regnskapstransaksjoner og identifiser:

1. Potensielle risikofaktorer og uregelmessigheter
2. Økonomiske mønstre og trender
3. Anbefalinger for revisjon

Transaksjonsdata (${analysisData.length} transaksjoner):
${JSON.stringify(analysisData.slice(0, 50))} // Limit to first 50 for size

Gi en strukturert analyse på norsk med:
- Sammendrag av funn
- Identifiserte risikoområder  
- Anbefalte revisjonshandlinger
- Konfidensnivå (1-10)

Svar kun med gyldig JSON.`;

    console.log('🤖 Sending request to OpenAI...');

    // Call OpenAI API with proper error handling
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
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
        max_completion_tokens: 4000,
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

      // Attempt to parse as JSON, with fallback handling
      try {
        analysisResult = JSON.parse(aiContent);
      } catch (parseError) {
        console.warn('Failed to parse OpenAI response as JSON, creating fallback:', parseError);
        // Create a structured fallback response
        analysisResult = {
          sammendrag: aiContent.substring(0, 500),
          risikoområder: ['Kunne ikke parse full AI-respons'],
          anbefalinger: ['Gjennomgå AI-analyse manuelt'],
          konfidensnivå: 5,
          feilmelding: 'AI-respons kunne ikke parses som JSON'
        };
      }
    } catch (error) {
      console.error('Error processing OpenAI response:', error);
      analysisResult = {
        sammendrag: 'AI-analyse feilet',
        risikoområder: ['Teknisk feil i AI-behandling'],
        anbefalinger: ['Kontakt systemadministrator'],
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
        model: 'gpt-5-2025-08-07'
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
      risikoområder: ['Systemfeil'],
      anbefalinger: ['Prøv igjen senere eller kontakt support'],
      konfidensnivå: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});