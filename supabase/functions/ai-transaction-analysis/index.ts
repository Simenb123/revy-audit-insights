import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionAnalysisRequest {
  clientId: string;
  versionId?: string;
  analysisType: 'anomaly_detection' | 'pattern_analysis' | 'risk_assessment' | 'fraud_detection';
  maxTransactions?: number;
}

interface AIAnalysisResult {
  insights: Array<{
    type: 'anomaly' | 'pattern' | 'risk' | 'recommendation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    affectedTransactions: string[];
    recommendedAction: string;
    confidence: number;
  }>;
  summary: {
    totalTransactionsAnalyzed: number;
    anomaliesFound: number;
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyFindings: string[];
  };
  metadata: {
    analysisType: string;
    modelUsed: string;
    processingTime: number;
    timestamp: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { clientId, versionId, analysisType, maxTransactions = 1000 }: TransactionAnalysisRequest = await req.json();

    console.log(`[AI Analysis] Starting ${analysisType} for client ${clientId}`);
    const startTime = Date.now();

    // Hent transaksjonsdata
    let query = supabase
      .from('general_ledger_transactions')
      .select(`
        id,
        transaction_date,
        debit_amount,
        credit_amount,
        description,
        voucher_number,
        reference_number,
        client_chart_of_accounts!inner(
          account_number,
          account_name,
          account_mappings(
            standard_accounts(
              analysis_group
            )
          )
        )
      `)
      .eq('client_id', clientId)
      .order('transaction_date', { ascending: false })
      .limit(maxTransactions);

    if (versionId) {
      query = query.eq('version_id', versionId);
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions found for analysis');
    }

    console.log(`[AI Analysis] Analyzing ${transactions.length} transactions`);

    // Forbered data for AI-analyse
    const transactionSummary = transactions.slice(0, 50).map(tx => ({
      id: tx.id,
      date: tx.transaction_date,
      account: tx.client_chart_of_accounts?.account_number,
      accountName: tx.client_chart_of_accounts?.account_name,
      auditArea: tx.client_chart_of_accounts?.account_mappings?.[0]?.standard_accounts?.analysis_group || 'other',
      debit: tx.debit_amount || 0,
      credit: tx.credit_amount || 0,
      description: tx.description?.substring(0, 100), // Begrens lengde
      voucher: tx.voucher_number
    }));

    // Generer statistikk for kontekst
    const stats = {
      totalTransactions: transactions.length,
      dateRange: {
        from: transactions[transactions.length - 1]?.transaction_date,
        to: transactions[0]?.transaction_date
      },
      totalDebit: transactions.reduce((sum, tx) => sum + (tx.debit_amount || 0), 0),
      totalCredit: transactions.reduce((sum, tx) => sum + (tx.credit_amount || 0), 0),
      uniqueAccounts: [...new Set(transactions.map(tx => tx.client_chart_of_accounts?.account_number))].length,
      uniqueVouchers: [...new Set(transactions.map(tx => tx.voucher_number))].length
    };

    // AI-analyse med OpenAI
    const systemPrompt = `Du er en ekspert på norsk revisjon og transaksjonsanalyse. Analyser disse regnskapstransaksjonene for ${analysisType}.

Kontekst:
- Totalt ${stats.totalTransactions} transaksjoner fra ${stats.dateRange.from} til ${stats.dateRange.to}
- Total debet: ${stats.totalDebit.toLocaleString('no-NO')} kr
- Total kredit: ${stats.totalCredit.toLocaleString('no-NO')} kr
- ${stats.uniqueAccounts} unike kontoer
- ${stats.uniqueVouchers} unike bilag

Fokuser på:
1. Uvanlige beløp eller mønstre
2. Transaksjoner på uvanlige tidspunkt
3. Potensielle feil eller inkonsistenser
4. Risikofylte transaksjoner
5. Brudd på normale regnskapsprinsipper

Svar på norsk med strukturerte innsikter.`;

    const analysisPrompt = `Analyser disse transaksjonene (viser første 50 av ${transactions.length}):

${JSON.stringify(transactionSummary, null, 2)}

Gi en detaljert analyse med:
1. Identifiserte anomalier eller uvanlige mønstre
2. Risikofaktorer og områder som krever oppmerksomhet
3. Konkrete anbefalinger for videre undersøkelse
4. Vurdering av overall risiko

Strukturer svaret som JSON med følgende format:
{
  "insights": [
    {
      "type": "anomaly|pattern|risk|recommendation",
      "severity": "low|medium|high|critical", 
      "title": "Kort tittel",
      "description": "Detaljert beskrivelse",
      "affectedTransactions": ["tx_id_1", "tx_id_2"],
      "recommendedAction": "Konkret anbefaling",
      "confidence": 0.95
    }
  ],
  "summary": {
    "totalTransactionsAnalyzed": ${transactions.length},
    "anomaliesFound": 0,
    "overallRiskLevel": "low|medium|high|critical",
    "keyFindings": ["Første hovedfunn", "Andre hovedfunn"]
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const aiResponse = await response.json();
    const analysisContent = aiResponse.choices[0].message.content;
    
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysisContent);
    } catch (parseError) {
      console.error('[AI Analysis] Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI analysis response');
    }

    const processingTime = Date.now() - startTime;

    const result: AIAnalysisResult = {
      insights: parsedAnalysis.insights || [],
      summary: {
        totalTransactionsAnalyzed: transactions.length,
        anomaliesFound: parsedAnalysis.summary?.anomaliesFound || 0,
        overallRiskLevel: parsedAnalysis.summary?.overallRiskLevel || 'low',
        keyFindings: parsedAnalysis.summary?.keyFindings || []
      },
      metadata: {
        analysisType,
        modelUsed: 'gpt-4.1-2025-04-14',
        processingTime,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`[AI Analysis] Completed in ${processingTime}ms. Found ${result.insights.length} insights.`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[AI Analysis] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});