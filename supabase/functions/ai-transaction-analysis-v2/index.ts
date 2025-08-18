import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  clientId: string;
  dataVersionId?: string;
  sessionType: string;
  analysisConfig: any;
}

serve(async (req) => {
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

    const { clientId, dataVersionId, sessionType, analysisConfig }: AnalysisRequest = await req.json();

    console.log('🧠 Starting AI transaction analysis V2 for:', { clientId, dataVersionId, sessionType });

    // Create analysis session
    const { data: session, error: sessionError } = await supabaseClient
      .from('ai_analysis_sessions')
      .insert({
        client_id: clientId,
        data_version_id: dataVersionId,
        session_type: sessionType,
        status: 'running',
        analysis_config: analysisConfig,
        progress_percentage: 10
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    console.log('📝 Created analysis session:', session.id);

    // Update progress
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ progress_percentage: 30 })
      .eq('id', session.id);

    // Fetch transaction data
    const { data: transactions, error: transactionError } = await supabaseClient
      .from('general_ledger_transactions')
      .select(`
        transaction_date,
        debit_amount,
        credit_amount,
        description,
        voucher_number,
        client_chart_of_accounts(account_number, account_name)
      `)
      .eq('client_id', clientId)
      .eq('version_id', dataVersionId)
      .order('transaction_date', { ascending: false })
      .limit(500);

    if (transactionError) {
      console.error('Transaction fetch error:', transactionError);
      await supabaseClient
        .from('ai_analysis_sessions')
        .update({ 
          status: 'failed',
          error_message: `Failed to fetch transactions: ${transactionError.message}`
        })
        .eq('id', session.id);
      throw new Error(`Failed to fetch transactions: ${transactionError.message}`);
    }

    console.log(`📊 Found ${transactions?.length || 0} transactions for AI analysis`);

    // Update progress
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ progress_percentage: 50 })
      .eq('id', session.id);

    if (!transactions || transactions.length === 0) {
      const errorMsg = 'No transaction data found for analysis';
      await supabaseClient
        .from('ai_analysis_sessions')
        .update({ 
          status: 'failed',
          error_message: errorMsg
        })
        .eq('id', session.id);
      throw new Error(errorMsg);
    }

    // Prepare data for analysis
    const analysisData = transactions.slice(0, 50).map(t => ({
      date: t.transaction_date,
      amount: t.debit_amount || t.credit_amount || 0,
      description: t.description?.substring(0, 50),
      account: t.client_chart_of_accounts?.account_number
    }));

    const prompt = `Analyser følgende ${analysisData.length} regnskapstransaksjoner.

Transaksjonsdata (utvalg):
${JSON.stringify(analysisData.slice(0, 10))}

Gi en strukturert analyse på norsk:

{
  "sammendrag": "Kort sammendrag av analysen (maks 300 tegn)",
  "risikoområder": ["område1", "område2", "område3"],
  "anbefalinger": ["anbefaling1", "anbefaling2", "anbefaling3"],
  "konfidensnivå": 8,
  "statistikk": {
    "totalTransaksjoner": ${transactions.length},
    "totalBeløp": "beregnet total",
    "periode": "fra - til"
  }
}`;

    // Update progress
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ progress_percentage: 70 })
      .eq('id', session.id);

    console.log('🤖 Sending request to OpenAI...');

    // Use OpenAI Responses API with JSON schema for structured output
    const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        input: [
          {
            role: 'system',
            content: 'Du er en erfaren norsk revisor som analyserer regnskapstransaksjoner og gir strukturerte analyser.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "transaction_analysis",
            schema: {
              type: "object",
              properties: {
                sammendrag: { type: "string", maxLength: 300 },
                risikoområder: { type: "array", items: { type: "string" }, maxItems: 5 },
                anbefalinger: { type: "array", items: { type: "string" }, maxItems: 5 },
                konfidensnivå: { type: "integer", minimum: 1, maximum: 10 },
                statistikk: {
                  type: "object",
                  properties: {
                    totalTransaksjoner: { type: "integer" },
                    totalBeløp: { type: "string" },
                    periode: { type: "string" }
                  }
                }
              },
              required: ["sammendrag", "risikoområder", "anbefalinger", "konfidensnivå"]
            }
          }
        }
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      
      await supabaseClient
        .from('ai_analysis_sessions')
        .update({ 
          status: 'failed',
          error_message: `OpenAI API error: ${openAIResponse.status}`
        })
        .eq('id', session.id);
      
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('✅ OpenAI response received');

    // Update progress
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ progress_percentage: 90 })
      .eq('id', session.id);

    let analysisResult;
    try {
      // Handle Responses API output format
      const aiOutput = openAIData.output;
      if (!aiOutput) {
        throw new Error('No output in OpenAI Responses API response');
      }

      // Since we use JSON schema, the output should already be structured
      if (typeof aiOutput === 'object') {
        analysisResult = aiOutput;
      } else {
        // Fallback: try to parse as JSON string
        try {
          analysisResult = JSON.parse(aiOutput);
        } catch (parseError) {
          console.warn('Failed to parse Responses API output, creating fallback');
          analysisResult = {
            sammendrag: 'Analyse gjennomført, men respons kunne ikke parses korrekt',
            risikoområder: ['Dataformat-problem', 'Manuell gjennomgang nødvendig'],
            anbefalinger: ['Kontroller AI-respons', 'Gjennomgå transaksjoner manuelt'],
            konfidensnivå: 4,
            statistikk: {
              totalTransaksjoner: transactions.length,
              totalBeløp: 'Ikke beregnet',
              periode: 'Se transaksjonsdata'
            },
            rawResponse: String(aiOutput).substring(0, 500)
          };
        }
      }
    } catch (error) {
      console.error('Error processing OpenAI Responses API output:', error);
      console.error('Full response:', JSON.stringify(openAIData, null, 2));
      analysisResult = {
        sammendrag: 'AI-analyse feilet på grunn av teknisk feil',
        risikoområder: ['Teknisk feil'],
        anbefalinger: ['Prøv igjen senere'],
        konfidensnivå: 1,
        error: error.message
      };
    }

    // Save results and complete session
    const finalResult = {
      ...analysisResult,
      metadata: {
        analysisDate: new Date().toISOString(),
        transactionCount: transactions.length,
        sessionId: session.id,
        model: 'gpt-5'
      }
    };

    // Save result to analysis_results_v2
    await supabaseClient
      .from('analysis_results_v2')
      .insert({
        session_id: session.id,
        analysis_type: sessionType,
        result_data: finalResult,
        confidence_score: analysisResult.konfidensnivå || 0
      });

    // Complete session
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ 
        status: 'completed',
        progress_percentage: 100,
        result_data: finalResult,
        completed_at: new Date().toISOString()
      })
      .eq('id', session.id);

    console.log('🎯 AI analysis V2 completed successfully');

    return new Response(JSON.stringify({
      sessionId: session.id,
      status: 'completed',
      result: finalResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ AI transaction analysis V2 failed:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});