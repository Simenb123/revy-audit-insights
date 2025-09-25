import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictiveAnalysisRequest {
  clientId: string;
  analysisType: 'risk_assessment' | 'trend_prediction' | 'anomaly_detection' | 'benchmarking' | 'comprehensive';
  fiscalYear?: number;
  includeHistoricalData?: boolean;
  compareWithBenchmarks?: boolean;
}

interface RiskFactor {
  category: string;
  factor: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  evidence: string[];
  recommendations: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface PredictiveInsight {
  type: 'risk' | 'opportunity' | 'trend' | 'anomaly' | 'compliance';
  title: string;
  description: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  impact: 'minimal' | 'moderate' | 'significant' | 'severe';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  actionRequired: boolean;
  recommendations: string[];
  supportingData: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody: PredictiveAnalysisRequest = await req.json();
    const { clientId, analysisType } = requestBody;

    console.log('Predictive analytics request:', { clientId, analysisType });

    // Gather comprehensive client data
    const clientData = await gatherClientData(supabase, clientId, requestBody.fiscalYear);
    
    let analysisResults;
    switch (analysisType) {
      case 'risk_assessment':
        analysisResults = await performRiskAssessment(openAIApiKey, clientData);
        break;
      case 'trend_prediction':
        analysisResults = await performTrendPrediction(openAIApiKey, clientData);
        break;
      case 'anomaly_detection':
        analysisResults = await performAnomalyDetection(openAIApiKey, clientData);
        break;
      case 'benchmarking':
        analysisResults = await performBenchmarking(openAIApiKey, clientData);
        break;
      case 'comprehensive':
        analysisResults = await performComprehensiveAnalysis(openAIApiKey, clientData);
        break;
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }

    return new Response(
      JSON.stringify(analysisResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Predictive analytics error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function gatherClientData(supabase: any, clientId: string, fiscalYear?: number) {
  console.log('Gathering client data for predictive analysis:', { clientId, fiscalYear });

  // Get client basic info
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError) {
    throw new Error(`Failed to fetch client: ${clientError.message}`);
  }

  // Get trial balance data
  const { data: trialBalance, error: tbError } = await supabase
    .from('trial_balances')
    .select('*')
    .eq('client_id', clientId)
    .order('period_year', { ascending: false })
    .limit(3); // Last 3 years

  // Get general ledger transactions
  const { data: transactions, error: transError } = await supabase
    .from('general_ledger_transactions')
    .select(`
      *,
      client_chart_of_accounts(account_number, account_name, account_type)
    `)
    .eq('client_id', clientId)
    .order('transaction_date', { ascending: false })
    .limit(1000); // Recent transactions

  // Get document analysis
  const { data: documents, error: docError } = await supabase
    .from('client_documents_files')
    .select('*')
    .eq('client_id', clientId)
    .not('ai_analysis_summary', 'is', null);

  // Get materiality settings
  const { data: materiality, error: matError } = await supabase
    .from('materiality_settings')
    .select('*')
    .eq('client_id', clientId);

  // Get audit history/findings
  const { data: auditFindings, error: auditError } = await supabase
    .from('revy_chat_sessions')
    .select('*, revy_chat_messages(*)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    client,
    trialBalance: trialBalance || [],
    transactions: transactions || [],
    documents: documents || [],
    materiality: materiality || [],
    auditFindings: auditFindings || [],
    fiscalYear: fiscalYear || new Date().getFullYear() - 1
  };
}

async function performRiskAssessment(apiKey: string, clientData: any): Promise<{
  riskFactors: RiskFactor[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  insights: PredictiveInsight[];
}> {
  const prompt = `Perform a comprehensive risk assessment for the following audit client:

Client Information:
- Company: ${clientData.client.company_name || clientData.client.name}
- Industry: ${clientData.client.industry || 'Not specified'}
- Employee Count: ${clientData.client.employee_count || 'Not specified'}

Financial Data:
- Trial Balance Periods: ${clientData.trialBalance.length} years of data
- Recent Transactions: ${clientData.transactions.length} transactions
- Documents Analyzed: ${clientData.documents.length} documents with AI analysis

Key Financial Indicators:
${JSON.stringify(calculateFinancialKpis(clientData.trialBalance), null, 2)}

Document Analysis Summary:
${clientData.documents.slice(0, 5).map((doc: any) => `- ${doc.file_name}: ${doc.ai_analysis_summary}`).join('\n')}

Based on this data, provide a comprehensive risk assessment in the following JSON format:
{
  "riskFactors": [
    {
      "category": "Financial|Operational|Compliance|Strategic|Technology",
      "factor": "Specific risk factor description",
      "riskLevel": "low|medium|high|critical",
      "probability": 0.0-1.0,
      "impact": 0.0-1.0,
      "riskScore": 0.0-10.0,
      "evidence": ["Supporting evidence from data"],
      "recommendations": ["Specific action recommendations"],
      "trend": "increasing|stable|decreasing"
    }
  ],
  "overallRiskLevel": "low|medium|high|critical",
  "riskScore": 0.0-10.0,
  "insights": [
    {
      "type": "risk|opportunity|trend|anomaly|compliance",
      "title": "Brief insight title",
      "description": "Detailed description",
      "confidence": 0.0-1.0,
      "urgency": "low|medium|high|critical",
      "impact": "minimal|moderate|significant|severe",
      "timeframe": "immediate|short_term|medium_term|long_term",
      "actionRequired": true/false,
      "recommendations": ["Specific recommendations"],
      "supportingData": []
    }
  ]
}

Focus on:
1. Financial ratios and trends
2. Cash flow patterns
3. Unusual transactions or patterns
4. Document compliance issues
5. Industry-specific risk factors
6. Materiality thresholds`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI risk assessment error: ${response.status}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    // Fallback response
    return {
      riskFactors: [],
      overallRiskLevel: 'medium',
      riskScore: 5.0,
      insights: []
    };
  }
}

async function performTrendPrediction(apiKey: string, clientData: any) {
  const prompt = `Analyze financial trends and make predictions for the following client:

Historical Trial Balance Data:
${JSON.stringify(clientData.trialBalance, null, 2)}

Recent Transaction Patterns:
- Total transactions analyzed: ${clientData.transactions.length}
- Transaction volume by month: ${calculateMonthlyVolume(clientData.transactions)}
- Account distribution: ${calculateAccountDistribution(clientData.transactions)}

Provide trend analysis and predictions in JSON format:
{
  "financialTrends": [
    {
      "metric": "Revenue|Expenses|Assets|Liabilities|Equity",
      "currentTrend": "increasing|decreasing|stable|volatile",
      "trendStrength": 0.0-1.0,
      "prediction": {
        "nextPeriod": number,
        "confidence": 0.0-1.0,
        "range": {"min": number, "max": number}
      },
      "insights": ["Key insights about this trend"]
    }
  ],
  "operationalTrends": [
    {
      "area": "Transaction Volume|Account Activity|Compliance",
      "trend": "Description of trend",
      "prediction": "Future outlook",
      "confidence": 0.0-1.0
    }
  ],
  "predictiveInsights": [
    {
      "type": "trend",
      "title": "Insight title",
      "description": "Detailed description",
      "confidence": 0.0-1.0,
      "timeframe": "short_term|medium_term|long_term",
      "impact": "positive|negative|neutral"
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.6
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI trend prediction error: ${response.status}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { financialTrends: [], operationalTrends: [], predictiveInsights: [] };
  }
}

async function performAnomalyDetection(apiKey: string, clientData: any) {
  const anomalies = detectStatisticalAnomalies(clientData.transactions);
  
  const prompt = `Analyze the following potential anomalies and provide AI-driven insights:

Statistical Anomalies Found:
${JSON.stringify(anomalies, null, 2)}

Client Context:
- Industry: ${clientData.client.industry || 'General'}
- Company Size: ${clientData.client.employee_count || 'Unknown'} employees
- Fiscal Year: ${clientData.fiscalYear}

Recent Documents Analysis:
${clientData.documents.slice(0, 3).map((doc: any) => `- ${doc.file_name}: ${doc.ai_analysis_summary}`).join('\n')}

Provide anomaly analysis in JSON format:
{
  "anomalies": [
    {
      "type": "transaction|amount|timing|frequency|pattern",
      "severity": "low|medium|high|critical",
      "description": "What makes this anomalous",
      "evidence": "Supporting data",
      "likelihood": "business_as_usual|unusual|suspicious|critical",
      "recommendations": ["What actions to take"],
      "auditPriority": "low|medium|high|urgent"
    }
  ],
  "patterns": [
    {
      "patternType": "seasonal|cyclical|irregular|systematic",
      "description": "Pattern description",
      "significance": "low|medium|high",
      "implication": "What this means for the audit"
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.5
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI anomaly detection error: ${response.status}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { anomalies: [], patterns: [] };
  }
}

async function performBenchmarking(apiKey: string, clientData: any) {
  const kpis = calculateFinancialKpis(clientData.trialBalance);
  
  const prompt = `Perform industry benchmarking analysis for the following client:

Client Financial KPIs:
${JSON.stringify(kpis, null, 2)}

Industry: ${clientData.client.industry || 'General Business'}
Company Size: ${clientData.client.employee_count || 'Not specified'} employees

Provide benchmarking analysis in JSON format:
{
  "benchmarkComparisons": [
    {
      "metric": "Current Ratio|Debt to Equity|ROA|ROE|Gross Margin|etc",
      "clientValue": number,
      "industryAverage": number,
      "industryMedian": number,
      "percentile": number,
      "performance": "above_average|average|below_average|poor",
      "gap": number,
      "insights": ["What this comparison means"],
      "recommendations": ["How to improve"]
    }
  ],
  "overallPerformance": {
    "score": 0-100,
    "ranking": "top_quartile|above_average|average|below_average|bottom_quartile",
    "strengths": ["Key strengths vs industry"],
    "weaknesses": ["Areas for improvement"],
    "opportunities": ["Market opportunities based on performance"]
  },
  "riskIndicators": [
    {
      "indicator": "Indicator name",
      "clientValue": number,
      "industryBenchmark": number,
      "riskLevel": "low|medium|high|critical",
      "explanation": "Why this indicates risk"
    }
  ]
}

Use typical industry benchmarks for the specified industry or general business if industry is unknown.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI benchmarking error: ${response.status}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { benchmarkComparisons: [], overallPerformance: {}, riskIndicators: [] };
  }
}

async function performComprehensiveAnalysis(apiKey: string, clientData: any) {
  const [riskAssessment, trendPrediction, anomalies, benchmarking] = await Promise.all([
    performRiskAssessment(apiKey, clientData),
    performTrendPrediction(apiKey, clientData),
    performAnomalyDetection(apiKey, clientData),
    performBenchmarking(apiKey, clientData)
  ]);

  return {
    summary: {
      analysisDate: new Date().toISOString(),
      clientId: clientData.client.id,
      overallRiskLevel: riskAssessment.overallRiskLevel,
      riskScore: riskAssessment.riskScore,
      dataQuality: calculateDataQuality(clientData),
      analysisConfidence: calculateAnalysisConfidence(clientData)
    },
    riskAssessment,
    trendPrediction,
    anomalyDetection: anomalies,
    benchmarking,
    recommendations: generateComprehensiveRecommendations(
      riskAssessment, 
      trendPrediction, 
      anomalies, 
      benchmarking
    )
  };
}

// Utility functions
function calculateFinancialKpis(trialBalance: any[]) {
  if (!trialBalance || trialBalance.length === 0) return {};

  const latest = trialBalance[0];
  const previous = trialBalance[1];

  return {
    currentYear: latest?.period_year,
    totalAssets: latest?.balance || 0,
    totalLiabilities: calculateTotalLiabilities(latest),
    totalEquity: calculateTotalEquity(latest),
    revenue: latest?.revenue || 0,
    netIncome: latest?.net_income || 0,
    // Calculate ratios if we have enough data
    currentRatio: previous ? calculateCurrentRatio(latest, previous) : null,
    debtToEquity: calculateDebtToEquity(latest),
    returnOnAssets: calculateROA(latest),
    yearOverYearGrowth: previous ? calculateGrowth(latest, previous) : null
  };
}

function calculateTotalLiabilities(trialBalance: any) {
  return trialBalance?.total_liabilities || 0;
}

function calculateTotalEquity(trialBalance: any) {
  return trialBalance?.total_equity || 0;
}

function calculateCurrentRatio(current: any, previous: any) {
  const currentAssets = current?.current_assets || 0;
  const currentLiabilities = current?.current_liabilities || 0;
  return currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
}

function calculateDebtToEquity(trialBalance: any) {
  const totalLiabilities = calculateTotalLiabilities(trialBalance);
  const totalEquity = calculateTotalEquity(trialBalance);
  return totalEquity > 0 ? totalLiabilities / totalEquity : 0;
}

function calculateROA(trialBalance: any) {
  const netIncome = trialBalance?.net_income || 0;
  const totalAssets = trialBalance?.balance || 0;
  return totalAssets > 0 ? netIncome / totalAssets : 0;
}

function calculateGrowth(current: any, previous: any) {
  const currentRevenue = current?.revenue || 0;
  const previousRevenue = previous?.revenue || 0;
  return previousRevenue > 0 ? (currentRevenue - previousRevenue) / previousRevenue : 0;
}

function calculateMonthlyVolume(transactions: any[]) {
  const volumeByMonth: { [key: string]: number } = {};
  transactions.forEach(tx => {
    if (tx.transaction_date) {
      const month = tx.transaction_date.substring(0, 7); // YYYY-MM
      volumeByMonth[month] = (volumeByMonth[month] || 0) + 1;
    }
  });
  return volumeByMonth;
}

function calculateAccountDistribution(transactions: any[]) {
  const distribution: { [key: string]: number } = {};
  transactions.forEach(tx => {
    if (tx.client_chart_of_accounts?.account_number) {
      const account = tx.client_chart_of_accounts.account_number;
      distribution[account] = (distribution[account] || 0) + 1;
    }
  });
  return distribution;
}

function detectStatisticalAnomalies(transactions: any[]) {
  const amounts = transactions
    .map(tx => Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0)))
    .filter(amount => amount > 0);

  if (amounts.length === 0) return [];

  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: Array<{
    transactionId: string;
    amount: number;
    date: string;
    description: string;
    deviationFromMean: number;
  }> = [];
  const threshold = mean + (2 * stdDev); // 2 standard deviations

  transactions.forEach(tx => {
    const amount = Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0));
    if (amount > threshold) {
      anomalies.push({
        transactionId: tx.id,
        amount: amount,
        date: tx.transaction_date,
        description: tx.description,
        deviationFromMean: (amount - mean) / stdDev
      });
    }
  });

  return anomalies.slice(0, 10); // Top 10 anomalies
}

function calculateDataQuality(clientData: any) {
  let score = 0;
  let maxScore = 0;

  // Trial balance data quality
  maxScore += 25;
  if (clientData.trialBalance.length >= 2) score += 25;
  else if (clientData.trialBalance.length >= 1) score += 15;

  // Transaction data quality
  maxScore += 25;
  if (clientData.transactions.length >= 500) score += 25;
  else if (clientData.transactions.length >= 100) score += 15;
  else if (clientData.transactions.length >= 10) score += 10;

  // Document analysis quality
  maxScore += 25;
  if (clientData.documents.length >= 10) score += 25;
  else if (clientData.documents.length >= 5) score += 15;
  else if (clientData.documents.length >= 1) score += 10;

  // Materiality settings
  maxScore += 25;
  if (clientData.materiality.length > 0) score += 25;

  return Math.round((score / maxScore) * 100);
}

function calculateAnalysisConfidence(clientData: any) {
  const dataQuality = calculateDataQuality(clientData);
  const dataRecency = calculateDataRecency(clientData);
  const dataCompleteness = calculateDataCompleteness(clientData);

  return Math.round((dataQuality + dataRecency + dataCompleteness) / 3);
}

function calculateDataRecency(clientData: any) {
  const currentYear = new Date().getFullYear();
  const latestYear = Math.max(...clientData.trialBalance.map((tb: any) => tb.period_year || 0));
  const yearDiff = currentYear - latestYear;

  if (yearDiff <= 1) return 100;
  if (yearDiff <= 2) return 80;
  if (yearDiff <= 3) return 60;
  return 40;
}

function calculateDataCompleteness(clientData: any) {
  let score = 0;
  let maxScore = 0;

  // Check for required data fields
  const checkFields = [
    clientData.client.industry,
    clientData.client.employee_count,
    clientData.trialBalance.length > 0,
    clientData.transactions.length > 0,
    clientData.documents.length > 0
  ];

  checkFields.forEach(field => {
    maxScore += 20;
    if (field) score += 20;
  });

  return Math.round((score / maxScore) * 100);
}

function generateComprehensiveRecommendations(riskAssessment: any, trendPrediction: any, anomalies: any, benchmarking: any) {
  const recommendations = [];

  // Risk-based recommendations
  if (riskAssessment.overallRiskLevel === 'high' || riskAssessment.overallRiskLevel === 'critical') {
    recommendations.push({
      category: 'Risk Management',
      priority: 'high',
      recommendation: 'Immediate risk mitigation required - focus audit procedures on identified high-risk areas',
      basedOn: 'Risk Assessment Analysis'
    });
  }

  // Trend-based recommendations
  if (trendPrediction.financialTrends?.some((trend: any) => trend.currentTrend === 'decreasing')) {
    recommendations.push({
      category: 'Financial Performance',
      priority: 'medium',
      recommendation: 'Monitor declining financial trends - consider going concern assessment',
      basedOn: 'Trend Prediction Analysis'
    });
  }

  // Anomaly-based recommendations
  if (anomalies.anomalies?.some((anomaly: any) => anomaly.severity === 'high' || anomaly.severity === 'critical')) {
    recommendations.push({
      category: 'Transaction Review',
      priority: 'high',
      recommendation: 'Detailed substantive testing required for identified anomalous transactions',
      basedOn: 'Anomaly Detection Analysis'
    });
  }

  // Benchmarking-based recommendations
  if (benchmarking.overallPerformance?.ranking === 'below_average' || benchmarking.overallPerformance?.ranking === 'bottom_quartile') {
    recommendations.push({
      category: 'Performance Improvement',
      priority: 'medium',
      recommendation: 'Client performance below industry standards - consider management discussions',
      basedOn: 'Benchmarking Analysis'
    });
  }

  return recommendations;
}