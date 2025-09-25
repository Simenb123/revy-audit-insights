import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BenchmarkingRequest {
  clientId: string;
  comparisonType: 'industry' | 'peers' | 'custom';
  industry?: string;
  peerClientIds?: string[];
  metrics: string[];
  fiscalYear?: number;
}

interface BenchmarkMetric {
  metric: string;
  clientValue: number;
  benchmarkValue: number;
  industryAverage: number;
  industryMedian: number;
  percentile: number;
  performance: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor';
  variance: number;
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
  recommendations: string[];
}

interface BenchmarkingResult {
  summary: {
    overallScore: number;
    ranking: string;
    totalMetrics: number;
    metricsCovered: number;
    dataQuality: number;
    confidenceLevel: number;
  };
  metrics: BenchmarkMetric[];
  insights: Array<{
    type: 'strength' | 'weakness' | 'opportunity' | 'threat';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    recommendations: string[];
  }>;
  industryProfile: {
    industry: string;
    averageRevenue: number;
    averageEmployees: number;
    typicalMargins: number;
    commonRisks: string[];
    keyPerformanceDrivers: string[];
  };
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

    const requestBody: BenchmarkingRequest = await req.json();
    const { clientId, comparisonType } = requestBody;

    console.log('Intelligent benchmarking request:', { clientId, comparisonType });

    // Gather client financial data
    const clientData = await gatherClientFinancialData(supabase, clientId, requestBody.fiscalYear);
    
    // Get comparison data based on type
    let comparisonData;
    switch (comparisonType) {
      case 'industry':
        comparisonData = await getIndustryBenchmarks(supabase, clientData.client.industry);
        break;
      case 'peers':
        comparisonData = await getPeerComparison(supabase, requestBody.peerClientIds || []);
        break;
      case 'custom':
        comparisonData = await getCustomBenchmarks(requestBody.metrics);
        break;
      default:
        throw new Error(`Unknown comparison type: ${comparisonType}`);
    }

    // Perform AI-driven benchmarking analysis
    const benchmarkingResult = await performIntelligentBenchmarking(
      openAIApiKey,
      clientData,
      comparisonData,
      requestBody
    );

    return new Response(
      JSON.stringify(benchmarkingResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Intelligent benchmarking error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function gatherClientFinancialData(supabase: any, clientId: string, fiscalYear?: number) {
  console.log('Gathering client financial data:', { clientId, fiscalYear });

  // Get client info
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError) {
    throw new Error(`Failed to fetch client: ${clientError.message}`);
  }

  // Get trial balance data for multiple years
  const { data: trialBalances, error: tbError } = await supabase
    .from('trial_balances')
    .select('*')
    .eq('client_id', clientId)
    .order('period_year', { ascending: false })
    .limit(5);

  // Get general ledger for analysis
  const { data: transactions, error: transError } = await supabase
    .from('general_ledger_transactions')
    .select(`
      *,
      client_chart_of_accounts(account_number, account_name, account_type)
    `)
    .eq('client_id', clientId)
    .order('transaction_date', { ascending: false })
    .limit(500);

  // Calculate financial metrics
  const metrics = calculateFinancialMetrics(trialBalances, transactions);

  return {
    client,
    trialBalances: trialBalances || [],
    transactions: transactions || [],
    metrics,
    fiscalYear: fiscalYear || new Date().getFullYear() - 1
  };
}

async function getIndustryBenchmarks(supabase: any, industry?: string) {
  // In a real implementation, this would fetch from industry databases
  // For now, we'll use default benchmarks based on industry
  const industryBenchmarks = getDefaultIndustryBenchmarks(industry);
  
  return {
    type: 'industry',
    industry: industry || 'General',
    benchmarks: industryBenchmarks,
    dataSource: 'industry_standards',
    lastUpdated: new Date().toISOString()
  };
}

async function getPeerComparison(supabase: any, peerClientIds: string[]) {
  if (peerClientIds.length === 0) {
    return { type: 'peers', peers: [], benchmarks: {} };
  }

  // Get peer data
  const { data: peerClients, error } = await supabase
    .from('clients')
    .select(`
      *,
      trial_balances(*)
    `)
    .in('id', peerClientIds);

  if (error) {
    console.error('Failed to fetch peer data:', error);
    return { type: 'peers', peers: [], benchmarks: {} };
  }

  // Calculate peer benchmarks
  const peerBenchmarks = calculatePeerBenchmarks(peerClients);

  return {
    type: 'peers',
    peers: peerClients,
    benchmarks: peerBenchmarks,
    peerCount: peerClients.length
  };
}

async function getCustomBenchmarks(metrics: string[]) {
  // Custom benchmarks based on specified metrics
  const customBenchmarks: { [key: string]: any } = {};
  
  metrics.forEach(metric => {
    customBenchmarks[metric] = getDefaultBenchmarkForMetric(metric);
  });

  return {
    type: 'custom',
    benchmarks: customBenchmarks,
    metrics
  };
}

async function performIntelligentBenchmarking(
  apiKey: string,
  clientData: any,
  comparisonData: any,
  request: BenchmarkingRequest
): Promise<BenchmarkingResult> {
  const prompt = `Perform intelligent benchmarking analysis for the following client:

Client Information:
- Company: ${clientData.client.company_name || clientData.client.name}
- Industry: ${clientData.client.industry || 'Not specified'}
- Employee Count: ${clientData.client.employee_count || 'Not specified'}
- Revenue: ${clientData.metrics.revenue || 'Not specified'}

Client Financial Metrics:
${JSON.stringify(clientData.metrics, null, 2)}

Benchmark Data:
${JSON.stringify(comparisonData.benchmarks, null, 2)}

Comparison Type: ${request.comparisonType}
Industry Context: ${comparisonData.industry || 'General'}

Provide comprehensive benchmarking analysis in the following JSON format:
{
  "summary": {
    "overallScore": 0-100,
    "ranking": "top_decile|top_quartile|above_average|average|below_average|bottom_quartile|bottom_decile",
    "totalMetrics": number,
    "metricsCovered": number,
    "dataQuality": 0-100,
    "confidenceLevel": 0-100
  },
  "metrics": [
    {
      "metric": "Revenue Growth|Profitability|Liquidity|Efficiency|Leverage|etc",
      "clientValue": number,
      "benchmarkValue": number,
      "industryAverage": number,
      "industryMedian": number,
      "percentile": 0-100,
      "performance": "excellent|above_average|average|below_average|poor",
      "variance": number,
      "trend": "improving|stable|declining",
      "insights": ["Key insights about this metric"],
      "recommendations": ["Specific improvement recommendations"]
    }
  ],
  "insights": [
    {
      "type": "strength|weakness|opportunity|threat",
      "title": "Brief insight title",
      "description": "Detailed description",
      "impact": "high|medium|low",
      "actionable": true/false,
      "recommendations": ["Specific actions to take"]
    }
  ],
  "industryProfile": {
    "industry": "Industry name",
    "averageRevenue": number,
    "averageEmployees": number,
    "typicalMargins": number,
    "commonRisks": ["List of common industry risks"],
    "keyPerformanceDrivers": ["Key success factors for this industry"]
  }
}

Focus on:
1. Financial performance vs benchmarks
2. Operational efficiency metrics
3. Industry-specific KPIs
4. Risk indicators
5. Growth and profitability trends
6. Working capital management
7. Leverage and liquidity ratios

Provide actionable insights and specific recommendations for improvement.`;

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
    throw new Error(`OpenAI benchmarking error: ${response.status}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    // Fallback response
    return {
      summary: {
        overallScore: 50,
        ranking: 'average',
        totalMetrics: 0,
        metricsCovered: 0,
        dataQuality: 50,
        confidenceLevel: 50
      },
      metrics: [],
      insights: [],
      industryProfile: {
        industry: clientData.client.industry || 'General',
        averageRevenue: 0,
        averageEmployees: 0,
        typicalMargins: 0,
        commonRisks: [],
        keyPerformanceDrivers: []
      }
    };
  }
}

function calculateFinancialMetrics(trialBalances: any[], transactions: any[]) {
  if (!trialBalances || trialBalances.length === 0) {
    return {};
  }

  const latest = trialBalances[0];
  const previous = trialBalances[1];

  const metrics: { [key: string]: any } = {
    // Basic metrics
    revenue: latest?.revenue || 0,
    netIncome: latest?.net_income || 0,
    totalAssets: latest?.balance || 0,
    totalLiabilities: latest?.total_liabilities || 0,
    totalEquity: latest?.total_equity || 0,
    
    // Calculated ratios
    currentRatio: calculateRatio(latest?.current_assets, latest?.current_liabilities),
    debtToEquity: calculateRatio(latest?.total_liabilities, latest?.total_equity),
    returnOnAssets: calculateRatio(latest?.net_income, latest?.balance),
    returnOnEquity: calculateRatio(latest?.net_income, latest?.total_equity),
    grossMargin: calculateRatio(latest?.gross_profit, latest?.revenue),
    
    // Growth metrics (if previous year available)
    revenueGrowth: previous ? calculateGrowthRate(latest?.revenue, previous?.revenue) : null,
    assetGrowth: previous ? calculateGrowthRate(latest?.balance, previous?.balance) : null,
    equityGrowth: previous ? calculateGrowthRate(latest?.total_equity, previous?.total_equity) : null,
    
    // Transaction-based metrics
    transactionVolume: transactions?.length || 0,
    averageTransactionSize: calculateAverageTransactionSize(transactions),
    monthlyTransactionVolume: calculateMonthlyTransactionVolume(transactions)
  };

  return metrics;
}

function calculateRatio(numerator: number, denominator: number): number {
  if (!numerator || !denominator || denominator === 0) return 0;
  return numerator / denominator;
}

function calculateGrowthRate(current: number, previous: number): number {
  if (!current || !previous || previous === 0) return 0;
  return (current - previous) / previous;
}

function calculateAverageTransactionSize(transactions: any[]): number {
  if (!transactions || transactions.length === 0) return 0;
  
  const totalAmount = transactions.reduce((sum, tx) => {
    const amount = Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0));
    return sum + amount;
  }, 0);
  
  return totalAmount / transactions.length;
}

function calculateMonthlyTransactionVolume(transactions: any[]): { [month: string]: number } {
  if (!transactions) return {};
  
  const volumeByMonth: { [month: string]: number } = {};
  
  transactions.forEach(tx => {
    if (tx.transaction_date) {
      const month = tx.transaction_date.substring(0, 7); // YYYY-MM
      volumeByMonth[month] = (volumeByMonth[month] || 0) + 1;
    }
  });
  
  return volumeByMonth;
}

function getDefaultIndustryBenchmarks(industry?: string): { [key: string]: any } {
  // Default industry benchmarks based on typical industry standards
  const benchmarks: { [key: string]: any } = {
    currentRatio: { average: 2.0, median: 1.8, quartiles: [1.2, 1.8, 2.0, 2.5] },
    debtToEquity: { average: 0.6, median: 0.5, quartiles: [0.2, 0.5, 0.6, 1.0] },
    returnOnAssets: { average: 0.05, median: 0.04, quartiles: [0.02, 0.04, 0.05, 0.08] },
    returnOnEquity: { average: 0.12, median: 0.10, quartiles: [0.06, 0.10, 0.12, 0.18] },
    grossMargin: { average: 0.30, median: 0.28, quartiles: [0.20, 0.28, 0.30, 0.40] },
    revenueGrowth: { average: 0.08, median: 0.06, quartiles: [0.02, 0.06, 0.08, 0.12] }
  };

  // Industry-specific adjustments
  if (industry) {
    switch (industry.toLowerCase()) {
      case 'retail':
        benchmarks.grossMargin = { average: 0.25, median: 0.23, quartiles: [0.18, 0.23, 0.25, 0.32] };
        benchmarks.currentRatio = { average: 1.5, median: 1.3, quartiles: [1.0, 1.3, 1.5, 2.0] };
        break;
      case 'manufacturing':
        benchmarks.currentRatio = { average: 2.5, median: 2.2, quartiles: [1.5, 2.2, 2.5, 3.2] };
        benchmarks.debtToEquity = { average: 0.8, median: 0.7, quartiles: [0.4, 0.7, 0.8, 1.2] };
        break;
      case 'services':
        benchmarks.returnOnAssets = { average: 0.08, median: 0.07, quartiles: [0.04, 0.07, 0.08, 0.12] };
        benchmarks.grossMargin = { average: 0.50, median: 0.48, quartiles: [0.35, 0.48, 0.50, 0.65] };
        break;
      case 'technology':
        benchmarks.grossMargin = { average: 0.70, median: 0.68, quartiles: [0.55, 0.68, 0.70, 0.85] };
        benchmarks.revenueGrowth = { average: 0.25, median: 0.20, quartiles: [0.10, 0.20, 0.25, 0.40] };
        break;
    }
  }

  return benchmarks;
}

function calculatePeerBenchmarks(peerClients: any[]): { [key: string]: any } {
  if (!peerClients || peerClients.length === 0) return {};

  const peerMetrics = peerClients.map(peer => 
    calculateFinancialMetrics(peer.trial_balances || [], [])
  );

  const benchmarks: { [key: string]: any } = {};
  
  // Calculate peer averages for key metrics
  const metrics = ['currentRatio', 'debtToEquity', 'returnOnAssets', 'returnOnEquity', 'grossMargin'];
  
  metrics.forEach(metric => {
    const values = peerMetrics
      .map(pm => pm[metric])
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (values.length > 0) {
      values.sort((a, b) => a - b);
      benchmarks[metric] = {
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        median: values[Math.floor(values.length / 2)],
        min: values[0],
        max: values[values.length - 1],
        quartiles: [
          values[Math.floor(values.length * 0.25)],
          values[Math.floor(values.length * 0.5)],
          values[Math.floor(values.length * 0.75)]
        ]
      };
    }
  });

  return benchmarks;
}

function getDefaultBenchmarkForMetric(metric: string): any {
  const defaults: { [key: string]: any } = {
    'revenue': { average: 1000000, target: 1500000 },
    'netIncome': { average: 100000, target: 150000 },
    'currentRatio': { average: 2.0, target: 2.5 },
    'debtToEquity': { average: 0.6, target: 0.4 },
    'returnOnAssets': { average: 0.05, target: 0.08 },
    'returnOnEquity': { average: 0.12, target: 0.15 },
    'grossMargin': { average: 0.30, target: 0.35 }
  };

  return defaults[metric] || { average: 0, target: 0 };
}