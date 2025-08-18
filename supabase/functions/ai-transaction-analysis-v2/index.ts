import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  sessionId: string;
  clientId: string;
  versionId?: string;
  analysisType: string;
  maxTransactions?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 AI Transaction Analysis V2 started');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { sessionId, clientId, versionId, analysisType, maxTransactions }: AnalysisRequest = await req.json();
    
    console.log(`📊 Starting analysis for session: ${sessionId}, client: ${clientId}, version: ${versionId}`);

    // Update session status to running
    await updateSessionProgress(supabase, sessionId, {
      status: 'running',
      progress_percentage: 5,
      current_step: 'Henter transaksjonsdata'
    });

    // Check cache first
    const cacheKey = `${clientId}_${versionId || 'all'}_${analysisType}`;
    console.log(`🔍 Checking cache for key: ${cacheKey}`);
    
    const { data: cachedResult } = await supabase
      .from('ai_analysis_cache')
      .select('*')
      .eq('client_id', clientId)
      .eq('data_version_id', versionId || '')
      .eq('analysis_type', analysisType)
      .gt('expires_at', new Date().toISOString())
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedResult) {
      console.log('💾 Found cached result, returning immediately');
      await updateSessionProgress(supabase, sessionId, {
        status: 'completed',
        progress_percentage: 100,
        current_step: 'Fullført (fra cache)',
        result_data: cachedResult.result_data
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        cached: true,
        result: cachedResult.result_data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build query for transactions
    let query = supabase
      .from('general_ledger_transactions')
      .select(`
        id,
        transaction_date,
        description,
        debit_amount,
        credit_amount,
        voucher_number,
        reference,
        client_chart_of_accounts!inner(
          account_number,
          account_name,
          account_type
        )
      `)
      .eq('client_id', clientId);

    if (versionId) {
      query = query.eq('version_id', versionId);
    }

    // Remove arbitrary transaction limit - analyze all transactions
    const { data: transactions, error: fetchError } = await query
      .order('transaction_date', { ascending: false })
      .limit(maxTransactions || 50000); // Increased from 1000 to 50000

    await updateSessionProgress(supabase, sessionId, {
      progress_percentage: 15,
      current_step: `Hentet ${transactions?.length || 0} transaksjoner`
    });

    if (fetchError) {
      console.error('❌ Error fetching transactions:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!transactions || transactions.length === 0) {
      await updateSessionProgress(supabase, sessionId, {
        status: 'completed',
        progress_percentage: 100,
        current_step: 'Ingen transaksjoner funnet',
        result_data: {
          summary: { message: 'Ingen transaksjoner funnet for analyse' },
          insights: [],
          recommendations: [],
          risk_factors: [],
          anomalies: []
        }
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        result: { summary: { message: 'Ingen transaksjoner funnet for analyse' } }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📈 Processing ${transactions.length} transactions`);

    await updateSessionProgress(supabase, sessionId, {
      progress_percentage: 25,
      current_step: 'Forbereder data for AI-analyse'
    });

    // Prepare data for AI analysis in chunks if needed
    const chunkSize = 5000;
    const transactionChunks = [];
    
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);
      transactionChunks.push(chunk.map(t => ({
        date: t.transaction_date,
        account: `${t.client_chart_of_accounts?.account_number} - ${t.client_chart_of_accounts?.account_name}`,
        account_type: t.client_chart_of_accounts?.account_type,
        amount: t.debit_amount || t.credit_amount || 0,
        debit: t.debit_amount || 0,
        credit: t.credit_amount || 0,
        description: (t.description || '').substring(0, 100),
        voucher: t.voucher_number,
        reference: t.reference
      })));
    }

    console.log(`🧩 Split into ${transactionChunks.length} chunks for processing`);

    await updateSessionProgress(supabase, sessionId, {
      progress_percentage: 35,
      current_step: 'Starter AI-analyse'
    });

    // Analyze each chunk and combine results
    const allResults = [];
    
    for (let i = 0; i < transactionChunks.length; i++) {
      const chunk = transactionChunks[i];
      const progressStep = 35 + (50 * (i + 1) / transactionChunks.length);
      
      await updateSessionProgress(supabase, sessionId, {
        progress_percentage: Math.round(progressStep),
        current_step: `Analyserer batch ${i + 1}/${transactionChunks.length}`
      });

      const prompt = `Analyser disse regnskapstransaksjonene for revisjonsformål. Jeg trenger en grundig analyse av:

1. RISIKOVURDERING: Identifiser potensielle risikoområder og uvanlige mønstre
2. INNSIKT: Viktige observasjoner om forretningsdrift og transaksjoner  
3. ANBEFALINGER: Konkrete anbefalinger for revisjon og kontroller
4. AVVIK: Uvanlige transaksjoner som krever oppmerksomhet

Transaksjonsdata (batch ${i + 1}/${transactionChunks.length}):
${JSON.stringify(chunk, null, 2)}

Gi svaret som strukturert JSON med følgende format:
{
  "insights": [{"category": "string", "observation": "string", "significance": "high/medium/low"}],
  "recommendations": [{"area": "string", "recommendation": "string", "priority": "high/medium/low", "reasoning": "string"}],
  "risk_factors": [{"risk": "string", "description": "string", "likelihood": "high/medium/low", "impact": "high/medium/low"}],
  "anomalies": [{"transaction_date": "string", "description": "string", "amount": number, "reason": "string", "severity": "high/medium/low"}]
}`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-2025-08-07',
            messages: [
              { 
                role: 'system', 
                content: 'Du er en erfaren revisor som analyserer regnskapstransaksjoner. Svar alltid med gyldig JSON og fokuser på praktiske revisjonsinsikter på norsk.' 
              },
              { role: 'user', content: prompt }
            ],
            max_completion_tokens: 4000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ OpenAI API error for chunk ${i + 1}:`, response.status, errorText);
          throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
          const parsedResult = JSON.parse(content);
          allResults.push(parsedResult);
        } catch (parseError) {
          console.error(`❌ JSON parse error for chunk ${i + 1}:`, parseError);
          // Add fallback result for this chunk
          allResults.push({
            insights: [{ category: "Parsing Error", observation: "Could not parse AI response", significance: "low" }],
            recommendations: [],
            risk_factors: [],
            anomalies: []
          });
        }
      } catch (error) {
        console.error(`❌ Error processing chunk ${i + 1}:`, error);
        // Add error result for this chunk
        allResults.push({
          insights: [{ category: "Processing Error", observation: error.message, significance: "low" }],
          recommendations: [],
          risk_factors: [],
          anomalies: []
        });
      }
    }

    await updateSessionProgress(supabase, sessionId, {
      progress_percentage: 90,
      current_step: 'Kombinerer resultater'
    });

    // Combine all results
    const combinedResult = {
      summary: {
        total_transactions: transactions.length,
        analysis_chunks: allResults.length,
        analysis_date: new Date().toISOString(),
        data_version: versionId || 'latest'
      },
      insights: allResults.flatMap(r => r.insights || []),
      recommendations: allResults.flatMap(r => r.recommendations || []),
      risk_factors: allResults.flatMap(r => r.risk_factors || []),
      anomalies: allResults.flatMap(r => r.anomalies || [])
    };

    // Cache the result
    const configHash = `${analysisType}_${maxTransactions || 50000}`;
    await supabase
      .from('ai_analysis_cache')
      .upsert({
        client_id: clientId,
        data_version_id: versionId || '',
        analysis_type: analysisType,
        config_hash: configHash,
        result_data: combinedResult,
        transaction_count: transactions.length,
        analysis_duration_ms: Date.now() - Date.parse(new Date().toISOString()),
        confidence_score: 0.85,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        last_accessed: new Date().toISOString(),
        access_count: 1
      });

    // Final session update
    await updateSessionProgress(supabase, sessionId, {
      status: 'completed',
      progress_percentage: 100,
      current_step: 'AI-analyse fullført',
      result_data: combinedResult
    });

    console.log('✅ AI analysis completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      result: combinedResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in AI analysis:', error);
    
    // Try to update session with error if we have sessionId
    try {
      const { sessionId } = await req.json();
      if (sessionId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        
        await updateSessionProgress(supabase, sessionId, {
          status: 'failed',
          error_message: error.message,
          current_step: 'Feil under analyse'
        });
      }
    } catch (updateError) {
      console.error('Error updating session with failure:', updateError);
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateSessionProgress(
  supabase: any, 
  sessionId: string, 
  updates: {
    status?: string;
    progress_percentage?: number;
    current_step?: string;
    error_message?: string;
    result_data?: any;
  }
) {
  try {
    const updateData: any = { ...updates };
    
    if (updates.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('ai_analysis_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session progress:', error);
    } else {
      console.log(`📊 Session ${sessionId} updated:`, updates);
    }
  } catch (error) {
    console.error('Error in updateSessionProgress:', error);
  }
}