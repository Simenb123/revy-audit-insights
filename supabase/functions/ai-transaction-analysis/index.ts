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
  analysisType: 'anomaly_detection' | 'pattern_analysis' | 'risk_assessment' | 'fraud_detection' | 'comparative_analysis' | 'industry_benchmark';
  maxTransactions?: number;
  modelPreference?: 'auto' | 'gpt-5' | 'gpt-4.1' | 'o3' | 'fast';
  compareWithPreviousPeriod?: boolean;
  industryCode?: string;
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
    const { 
      clientId, 
      versionId, 
      analysisType, 
      maxTransactions = 1000,
      modelPreference = 'auto',
      compareWithPreviousPeriod = false,
      industryCode
    }: TransactionAnalysisRequest = await req.json();

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

    console.log(`[AI Analysis] Analyzing ${transactions.length} transactions with model preference: ${modelPreference}`);

    // Determine optimal AI model based on analysis type and preferences
    const selectOptimalModel = (analysisType: string, modelPref: string, transactionCount: number): string => {
      if (modelPref !== 'auto') {
        const modelMap = {
          'gpt-5': 'gpt-5-2025-08-07',
          'gpt-4.1': 'gpt-4.1-2025-04-14', 
          'o3': 'o3-2025-04-16',
          'fast': 'gpt-5-mini-2025-08-07'
        };
        return modelMap[modelPref as keyof typeof modelMap] || 'gpt-4.1-2025-04-14';
      }

      // Auto-selection based on complexity
      if (analysisType === 'anomaly_detection' && transactionCount > 500) {
        return 'o3-2025-04-16'; // Best for complex pattern recognition
      } else if (analysisType === 'fraud_detection') {
        return 'gpt-5-2025-08-07'; // Most comprehensive reasoning
      } else if (analysisType === 'comparative_analysis') {
        return 'gpt-5-2025-08-07'; // Best for multi-period analysis
      } else if (transactionCount < 100) {
        return 'gpt-5-mini-2025-08-07'; // Fast for smaller datasets
      }
      return 'gpt-4.1-2025-04-14'; // Reliable default
    };

    const selectedModel = selectOptimalModel(analysisType, modelPreference, transactions.length);
    console.log(`[AI Analysis] Selected model: ${selectedModel}`);

    // Get comparison data if requested
    let comparisonData = null;
    if (compareWithPreviousPeriod) {
      const currentDate = new Date(transactions[0]?.transaction_date || new Date());
      const previousYearStart = new Date(currentDate.getFullYear() - 1, 0, 1);
      const previousYearEnd = new Date(currentDate.getFullYear() - 1, 11, 31);

      const { data: previousTransactions } = await supabase
        .from('general_ledger_transactions')
        .select('transaction_date, debit_amount, credit_amount, client_chart_of_accounts(account_number)')
        .eq('client_id', clientId)
        .gte('transaction_date', previousYearStart.toISOString())
        .lte('transaction_date', previousYearEnd.toISOString())
        .limit(1000);

      if (previousTransactions && previousTransactions.length > 0) {
        comparisonData = {
          totalTransactions: previousTransactions.length,
          totalDebit: previousTransactions.reduce((sum, tx) => sum + (tx.debit_amount || 0), 0),
          totalCredit: previousTransactions.reduce((sum, tx) => sum + (tx.credit_amount || 0), 0),
          uniqueAccounts: [...new Set(previousTransactions.map(tx => tx.client_chart_of_accounts?.account_number))].length
        };
      }
    }

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

    // Enhanced AI analysis with dynamic prompts
    const getEnhancedSystemPrompt = (analysisType: string, industryCode?: string): string => {
      const basePrompt = `Du er en ekspert på norsk revisjon og transaksjonsanalyse med dyp kunnskap om regnskapsregler, ISA-standarder og norske regnskapsprinsipper.`;
      
      const industryContext = industryCode ? `
      
Bransje-spesifikk kontekst (NACE ${industryCode}):
- Ta hensyn til bransjetypiske transaksjoner og risiki
- Sammenlign med normale mønstre for denne bransjen
- Identifiser avvik fra bransjestandarder` : '';

      switch (analysisType) {
        case 'anomaly_detection':
          return `${basePrompt}${industryContext}
          
Fokuser på anomali-deteksjon:
- Statistiske avvik fra normale mønstre
- Uvanlige tidsperioder (helger, høytider, etter arbeidstid)
- Beløp som er avrundet eller under autorisasjonsgrenser
- Transaksjoner uten bilag eller med manglende referanser
- Sekvensielle avbrudd i bilagsnummerering
- Transaksjoner som reverserer tidligere poster
- Uvanlige kontokombiner eller posterings-mønstre`;

        case 'fraud_detection':
          return `${basePrompt}${industryContext}
          
Fokuser på potensielt misligheter:
- Indikatorer på manipulasjon eller overføring
- Uautoriserte endringer i stamdata
- Transaksjoner som kringgår normale kontroller
- Oppdelinger av beløp for å unngå godkjenningsgrenser
- Transaksjoner til ukjente eller relaterte parter
- Timing-relaterte manipulasjoner (periode-slutt)
- Systembrukere med unormale transaksjons-mønstre`;

        case 'comparative_analysis':
          return `${basePrompt}${industryContext}
          
Fokuser på sammenlignende analyse:
- År-over-år trender og endringer
- Sesongjusteringer og periodiske variationer
- Vekstrater og utviklingsmønstre
- Avvik fra historiske data
- Endringer i regnskapsprinsipper eller klassifikasjoner`;

        case 'industry_benchmark':
          return `${basePrompt}${industryContext}
          
Fokuser på bransje-benchmarking:
- Sammenlign nøkkeltall med bransjegjennomsnitt
- Identifiser uvanlige regnskapsmetoder for bransjen
- Vurder transaksjonsvolum og -typer mot bransjenorm
- Analyser kostnad/inntekt-strukturer`;

        default:
          return `${basePrompt}${industryContext}
          
Generell transaksjonsanalyse:
- Identifiser uvanlige mønstre og anomalier
- Vurder risikofaktorer og kontroll-svakheter
- Gi anbefalinger for videre revisjonsprosedyrer
- Fokuser på vesentlighet og risiko`;
      }
    };

    const systemPrompt = getEnhancedSystemPrompt(analysisType, industryCode);

    const contextInfo = `
Kontekst:
- Totalt ${stats.totalTransactions} transaksjoner fra ${stats.dateRange.from} til ${stats.dateRange.to}
- Total debet: ${stats.totalDebit.toLocaleString('no-NO')} kr
- Total kredit: ${stats.totalCredit.toLocaleString('no-NO')} kr
- ${stats.uniqueAccounts} unike kontoer
- ${stats.uniqueVouchers} unike bilag
- AI-modell: ${selectedModel}
${comparisonData ? `
- Sammenligning med forrige periode:
  * Forrige år: ${comparisonData.totalTransactions} transaksjoner
  * Debet endring: ${((stats.totalDebit - comparisonData.totalDebit) / comparisonData.totalDebit * 100).toFixed(1)}%
  * Kredit endring: ${((stats.totalCredit - comparisonData.totalCredit) / comparisonData.totalCredit * 100).toFixed(1)}%` : ''}

Analyser transaksjonene grundig og gi strukturerte innsikter på norsk.`;

    const analysisPrompt = `${contextInfo}

Analyser disse transaksjonene (viser utvalg av ${Math.min(50, transactions.length)} av totalt ${transactions.length}):

${JSON.stringify(transactionSummary, null, 2)}

${comparisonData ? `
Sammenligning med forrige periode:
${JSON.stringify(comparisonData, null, 2)}
` : ''}

Basert på analysetypen "${analysisType}", gi en detaljert vurdering med:

1. Identifiserte anomalier, mønstre eller avvik
2. Risikofaktorer og områder som krever oppmerksomhet  
3. Konkrete anbefalinger for videre revisjonsprosedyrer
4. Overall risiko-vurdering med begrunnelse
5. Spesifikke transaksjoner som bør undersøkes nærmere

Strukturer svaret som JSON med følgende format:
{
  "insights": [
    {
      "type": "anomaly|pattern|risk|recommendation|comparison|benchmark",
      "severity": "low|medium|high|critical", 
      "title": "Kort beskrivende tittel",
      "description": "Detaljert beskrivelse av funnet",
      "affectedTransactions": ["tx_id_1", "tx_id_2"],
      "recommendedAction": "Konkret anbefaling for revisors oppfølging",
      "confidence": 0.95,
      "potentialImpact": "Beskrivelse av mulig konsekvens"
    }
  ],
  "summary": {
    "totalTransactionsAnalyzed": ${transactions.length},
    "anomaliesFound": 0,
    "overallRiskLevel": "low|medium|high|critical",
    "keyFindings": ["Første hovedfunn", "Andre hovedfunn"],
    "recommendedProcedures": ["Anbefalt revisjonsprosedyre 1", "Anbefalt revisjonsprosedyre 2"]
  }
}`;

    // Determine appropriate parameters for the selected model
    const getModelParameters = (model: string) => {
      if (model.startsWith('gpt-5') || model.startsWith('o3')) {
        return {
          max_completion_tokens: 3000,
          // Note: No temperature parameter for GPT-5 and O3 models
        };
      } else {
        return {
          max_tokens: 2000,
          temperature: 0.3,
        };
      }
    };

    const modelParams = getModelParameters(selectedModel);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        ...modelParams,
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
        modelUsed: selectedModel,
        processingTime,
        timestamp: new Date().toISOString(),
        comparisonIncluded: !!comparisonData,
        industryCode: industryCode || null
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