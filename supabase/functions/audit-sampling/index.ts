import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabase } from '../_shared/supabaseClient.ts';
import { log, error as logError } from '../_shared/log.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SamplingRequest {
  clientId: string;
  fiscalYear: number;
  testType: 'SUBSTANTIVE' | 'CONTROL';
  method: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED' | 'THRESHOLD';
  populationSize: number;
  populationSum: number;
  materiality?: number;
  expectedMisstatement?: number;
  confidenceLevel: number;
  riskLevel: 'lav' | 'moderat' | 'hoy';
  tolerableDeviationRate?: number;
  expectedDeviationRate?: number;
  strataBounds?: number[];
  thresholdAmount?: number;
  seed?: number;
  useHighRiskInclusion?: boolean;
  save?: boolean;
  planName?: string;
  selectedStandardNumbers?: string[];
  excludedAccountNumbers?: string[];
}

interface Transaction {
  id: string;
  transaction_date: string;
  account_no: string;
  account_name: string;
  description: string;
  amount: number;
  risk_score?: number;
}

interface SamplingPlan {
  id?: string;
  clientId: string;
  fiscalYear: number;
  testType: 'SUBSTANTIVE' | 'CONTROL';
  method: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED' | 'THRESHOLD';
  populationSize: number;
  populationSum: number;
  materiality?: number;
  expectedMisstatement?: number;
  confidenceLevel: number;
  riskLevel: 'lav' | 'moderat' | 'hoy';
  tolerableDeviationRate?: number;
  expectedDeviationRate?: number;
  strataBounds?: number[];
  thresholdAmount?: number;
  recommendedSampleSize: number;
  actualSampleSize: number;
  coveragePercentage: number;
  generatedAt: string;
  notes?: string;
  metadata: any;
}

// Cache for storing results (5 minutes TTL)
const cache = new Map<string, { data: any; expires: number }>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Health endpoint
  if (url.pathname.endsWith('/health')) {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache_entries: cache.size,
      last_plan: Array.from(cache.values()).pop()?.data?.plan || null
    };
    
    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = getSupabase(req);
    const payload: SamplingRequest = await req.json();
    
    log('🎯 Audit sampling request:', payload);

    // Generate cache key
    const cacheKey = generateCacheKey(payload);
    
    // Check cache first (unless saving)
    if (!payload.save) {
      const cached = cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        log('📦 Returning cached result');
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Fetch transaction data
    const transactions = await fetchTransactionData(supabase, payload);
    log(`📊 Found ${transactions.length} transactions for analysis`);

    // Calculate recommended sample size
    const recommendedSampleSize = calculateSampleSize(payload, transactions);
    log(`🔢 Recommended sample size: ${recommendedSampleSize}`);

    // Generate sample
    const sample = generateSample(transactions, payload, recommendedSampleSize);
    log(`✅ Generated sample with ${sample.length} items`);

    // Calculate coverage
    const sampleSum = sample.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const coveragePercentage = (sampleSum / payload.populationSum) * 100;

    // Generate automatic plan name if not provided
    const planName = payload.planName || generateAutomaticPlanName(payload);

    // Create plan object
    const plan: SamplingPlan = {
      clientId: payload.clientId,
      fiscalYear: payload.fiscalYear,
      testType: payload.testType,
      method: payload.method,
      populationSize: payload.populationSize,
      populationSum: payload.populationSum,
      materiality: payload.materiality,
      expectedMisstatement: payload.expectedMisstatement,
      confidenceLevel: payload.confidenceLevel,
      riskLevel: payload.riskLevel,
      tolerableDeviationRate: payload.tolerableDeviationRate,
      expectedDeviationRate: payload.expectedDeviationRate,
      strataBounds: payload.strataBounds,
      thresholdAmount: payload.thresholdAmount,
      recommendedSampleSize,
      actualSampleSize: sample.length,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      generatedAt: new Date().toISOString(),
      notes: planName,
      metadata: {
        seed: payload.seed,
        useHighRiskInclusion: payload.useHighRiskInclusion,
        method_details: getMethodDetails(payload.method),
        generation_timestamp: new Date().toISOString(),
        selectedStandardNumbers: payload.selectedStandardNumbers,
        excludedAccountNumbers: payload.excludedAccountNumbers
      }
    };

    const result = { plan, sample };

    // Save to database if requested
    if (payload.save) {
      await savePlanToDatabase(supabase, plan, sample);
      log('💾 Plan saved to database');
    }

    // Cache result for 5 minutes
    cache.set(cacheKey, {
      data: result,
      expires: Date.now() + (5 * 60 * 1000)
    });

    // Clean expired cache entries
    cleanExpiredCache();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('❌ Audit sampling failed:', error);
    return new Response(JSON.stringify({ 
      error: 'Sampling failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function fetchTransactionData(supabase: any, payload: SamplingRequest): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('general_ledger_transactions')
    .select(`
      id,
      transaction_date,
      debit_amount,
      credit_amount,
      description,
      client_chart_of_accounts!inner(
        account_number,
        account_name
      )
    `)
    .eq('client_id', payload.clientId)
    .gte('transaction_date', `${payload.fiscalYear}-01-01`)
    .lte('transaction_date', `${payload.fiscalYear}-12-31`)
    .order('transaction_date');

  if (error) throw error;

  return (data || []).map(tx => ({
    id: tx.id,
    transaction_date: tx.transaction_date,
    account_no: tx.client_chart_of_accounts.account_number,
    account_name: tx.client_chart_of_accounts.account_name,
    description: tx.description || '',
    amount: tx.debit_amount || -(tx.credit_amount || 0),
    risk_score: calculateRiskScore(tx, payload)
  }));
}

function calculateSampleSize(payload: SamplingRequest, transactions: Transaction[]): number {
  if (payload.testType === 'SUBSTANTIVE') {
    return calculateMUSSampleSize(payload);
  } else {
    return calculateAttributeSampleSize(payload);
  }
}

function calculateMUSSampleSize(payload: SamplingRequest): number {
  if (!payload.materiality || !payload.expectedMisstatement) {
    return Math.min(100, Math.max(30, Math.ceil(payload.populationSize * 0.05)));
  }

  // Synchronized MUS calculation with frontend
  const poissonFactor = -Math.log(1 - (payload.confidenceLevel / 100));
  const expectedErrorFactor = payload.expectedMisstatement / payload.materiality;
  
  const sampleSize = Math.ceil(
    (payload.populationSum / payload.materiality) * 
    (poissonFactor + expectedErrorFactor)
  );
  
  return Math.min(payload.populationSize, Math.max(30, sampleSize));
}

function calculateAttributeSampleSize(payload: SamplingRequest): number {
  if (!payload.tolerableDeviationRate || !payload.expectedDeviationRate) {
    return Math.min(100, Math.max(30, Math.ceil(payload.populationSize * 0.05)));
  }

  // Cochran formula with finite population correction
  const z = getZScore(payload.confidenceLevel);
  const p = payload.expectedDeviationRate / 100;
  const q = 1 - p;
  const e = (payload.tolerableDeviationRate - payload.expectedDeviationRate) / 100;
  
  // Basic Cochran formula
  const n0 = (z * z * p * q) / (e * e);
  
  // Finite population correction
  const n = n0 / (1 + (n0 - 1) / payload.populationSize);
  
  const riskMultiplier = getRiskMultiplier(payload.riskLevel);
  return Math.min(payload.populationSize, Math.max(30, Math.ceil(n * riskMultiplier)));
}

function generateSample(transactions: Transaction[], payload: SamplingRequest, sampleSize: number): Transaction[] {
  const seed = payload.seed || Date.now();
  const rng = createSeededRNG(seed);

  // Include high-risk transactions if requested
  let sample: Transaction[] = [];
  let remainingTransactions = [...transactions];

  if (payload.useHighRiskInclusion) {
    const highRiskTxs = transactions.filter(tx => (tx.risk_score || 0) > 0.8);
    sample = [...highRiskTxs];
    remainingTransactions = transactions.filter(tx => (tx.risk_score || 0) <= 0.8);
  }

  const remainingSampleSize = sampleSize - sample.length;

  switch (payload.method) {
    case 'SRS':
      sample.push(...randomSample(remainingTransactions, remainingSampleSize, rng));
      break;
    case 'SYSTEMATIC':
      sample.push(...systematicSample(remainingTransactions, remainingSampleSize, rng));
      break;
    case 'MUS':
      sample.push(...musSelect(remainingTransactions, remainingSampleSize, payload.populationSum, rng));
      break;
    case 'STRATIFIED':
      sample.push(...stratifiedSample(remainingTransactions, remainingSampleSize, payload.strataBounds || [], rng));
      break;
    case 'THRESHOLD':
      sample.push(...thresholdSample(remainingTransactions, remainingSampleSize, payload.thresholdAmount || 0, rng));
      break;
  }

  return sample.slice(0, sampleSize);
}

function randomSample(transactions: Transaction[], size: number, rng: () => number): Transaction[] {
  const shuffled = [...transactions].sort(() => rng() - 0.5);
  return shuffled.slice(0, size);
}

function systematicSample(transactions: Transaction[], size: number, rng: () => number): Transaction[] {
  if (size >= transactions.length) return transactions;
  
  const interval = Math.floor(transactions.length / size);
  const start = Math.floor(rng() * interval);
  const sample: Transaction[] = [];
  
  for (let i = 0; i < size; i++) {
    const index = (start + i * interval) % transactions.length;
    sample.push(transactions[index]);
  }
  
  return sample;
}

function musSelect(transactions: Transaction[], size: number, populationSum: number, rng: () => number): Transaction[] {
  const sample: Transaction[] = [];
  const cumulativeAmounts: number[] = [];
  let cumSum = 0;
  
  // Build cumulative amounts
  for (const tx of transactions) {
    cumSum += Math.abs(tx.amount);
    cumulativeAmounts.push(cumSum);
  }
  
  const interval = populationSum / size;
  
  for (let i = 0; i < size; i++) {
    const randomStart = rng() * interval;
    const targetAmount = randomStart + i * interval;
    
    // Find transaction containing this amount
    const index = cumulativeAmounts.findIndex(amount => amount >= targetAmount);
    if (index >= 0 && !sample.find(tx => tx.id === transactions[index].id)) {
      sample.push(transactions[index]);
    }
  }
  
  return sample;
}

function stratifiedSample(transactions: Transaction[], size: number, bounds: number[], rng: () => number): Transaction[] {
  if (bounds.length === 0) return randomSample(transactions, size, rng);
  
  // Create strata
  const strata: Transaction[][] = [];
  const sortedBounds = [0, ...bounds.sort((a, b) => a - b), Infinity];
  
  for (let i = 0; i < sortedBounds.length - 1; i++) {
    const lower = sortedBounds[i];
    const upper = sortedBounds[i + 1];
    strata.push(transactions.filter(tx => Math.abs(tx.amount) >= lower && Math.abs(tx.amount) < upper));
  }
  
  // Allocate sample size proportionally
  const sample: Transaction[] = [];
  const totalTxs = transactions.length;
  
  for (const stratum of strata) {
    if (stratum.length === 0) continue;
    
    const stratumSize = Math.max(1, Math.round((stratum.length / totalTxs) * size));
    sample.push(...randomSample(stratum, stratumSize, rng));
  }
  
  return sample.slice(0, size);
}

function thresholdSample(transactions: Transaction[], size: number, threshold: number, rng: () => number): Transaction[] {
  const aboveThreshold = transactions.filter(tx => Math.abs(tx.amount) >= threshold);
  const belowThreshold = transactions.filter(tx => Math.abs(tx.amount) < threshold);
  
  let sample = [...aboveThreshold];
  const remainingSize = size - sample.length;
  
  if (remainingSize > 0 && belowThreshold.length > 0) {
    sample.push(...randomSample(belowThreshold, remainingSize, rng));
  }
  
  return sample.slice(0, size);
}

function createSeededRNG(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

// Calculate actual risk score based on transaction characteristics
function calculateRiskScore(tx: any, payload: SamplingRequest): number {
  let riskScore = 0.1; // Base risk score
  
  const amount = Math.abs(tx.debit_amount || tx.credit_amount || 0);
  const accountNumber = tx.client_chart_of_accounts?.account_number || '';
  
  // Amount-based risk factors
  if (payload.materiality && amount > payload.materiality * 0.5) {
    riskScore += 0.3; // High amount risk
  }
  
  // Account-based risk factors (simplified risk assessment)
  if (accountNumber.startsWith('1')) { // Assets
    riskScore += 0.1;
  } else if (accountNumber.startsWith('2')) { // Liabilities  
    riskScore += 0.2;
  } else if (accountNumber.startsWith('3')) { // Revenue
    riskScore += 0.25;
  } else if (accountNumber.startsWith('4') || accountNumber.startsWith('5')) { // Expenses
    riskScore += 0.15;
  }
  
  // Description-based risk (simple keyword matching)
  const description = (tx.description || '').toLowerCase();
  const highRiskKeywords = ['mva', 'lån', 'rente', 'avskrivning', 'nedskrivning'];
  if (highRiskKeywords.some(keyword => description.includes(keyword))) {
    riskScore += 0.2;
  }
  
  return Math.min(1.0, riskScore); // Cap at 1.0
}

function getRiskMultiplier(riskLevel: string): number {
  // Use consistent risk factors with frontend
  switch (riskLevel) {
    case 'lav': return 0.8;
    case 'moderat': return 1.0;
    case 'hoy': return 1.3;
    default: return 1.0;
  }
}

// Removed getConfidenceMultiplier to sync with frontend - risk adjustment applied later

function getZScore(confidence: number): number {
  if (confidence >= 99) return 2.58;
  if (confidence >= 95) return 1.96;
  if (confidence >= 90) return 1.65;
  return 1.96;
}

function getMethodDetails(method: string): any {
  const details = {
    'SRS': { name: 'Simple Random Sampling', description: 'Tilfeldig utvalg uten stratifisering' },
    'SYSTEMATIC': { name: 'Systematic Sampling', description: 'Systematisk utvalg med fast intervall' },
    'MUS': { name: 'Monetary Unit Sampling', description: 'Pengeenhetsutvalg med sannsynlighet proporsjonal med beløp' },
    'STRATIFIED': { name: 'Stratified Sampling', description: 'Stratifisert utvalg basert på beløpsgrenser' },
    'THRESHOLD': { name: 'Threshold Sampling', description: 'Terskelbasert utvalg med høye beløp inkludert' }
  };
  return details[method] || { name: method, description: 'Ukjent metode' };
}

function generateAutomaticPlanName(payload: SamplingRequest): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('nb-NO', { 
    day: 'numeric', 
    month: 'short' 
  });
  const timeStr = now.toLocaleTimeString('nb-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const methodNames = {
    'SRS': 'SRS',
    'SYSTEMATIC': 'Systematisk',
    'MUS': 'MUS',
    'STRATIFIED': 'Stratifisert',
    'THRESHOLD': 'Terskel'
  };
  
  const methodName = methodNames[payload.method] || payload.method;
  return `${methodName} ${dateStr}, ${timeStr}`;
}

async function savePlanToDatabase(supabase: any, plan: SamplingPlan, sample: Transaction[]) {
  // Insert sampling plan
  const { data: planData, error: planError } = await supabase
    .from('audit_sampling_plans')
    .insert({
      client_id: plan.clientId,
      fiscal_year: plan.fiscalYear,
      test_type: plan.testType,
      method: plan.method,
      population_size: plan.populationSize,
      population_sum: plan.populationSum,
      materiality: plan.materiality,
      expected_misstatement: plan.expectedMisstatement,
      confidence_level: plan.confidenceLevel,
      risk_level: plan.riskLevel,
      tolerable_deviation_rate: plan.tolerableDeviationRate,
      expected_deviation_rate: plan.expectedDeviationRate,
      strata_bounds: plan.strataBounds,
      threshold_amount: plan.thresholdAmount,
      recommended_sample_size: plan.recommendedSampleSize,
      actual_sample_size: plan.actualSampleSize,
      coverage_percentage: plan.coveragePercentage,
      plan_name: plan.notes,
      notes: plan.notes,
      metadata: plan.metadata
    })
    .select()
    .single();

  if (planError) throw planError;

  // Insert sample items
  if (sample.length > 0) {
    const { error: itemsError } = await supabase
      .from('audit_sampling_items')
      .insert(
        sample.map((tx, index) => ({
          plan_id: planData.id,
          transaction_id: tx.id,
          amount: tx.amount,
          risk_score: tx.risk_score || 0,
          account_no: tx.account_no,
          account_name: tx.account_name,
          transaction_date: tx.transaction_date,
          description: tx.description,
          is_high_risk: (tx.risk_score || 0) > 0.8,
          stratum_id: Math.floor(index / 100), // Simple stratification
          selection_method: plan.method
        }))
      );

    if (itemsError) throw itemsError;
  }

  // Log the action
  const { error: logError } = await supabase
    .from('audit_logs')
    .insert({
      client_id: plan.clientId,
      action_type: 'sampling_plan_created',
      area_name: 'sampling',
      description: `Audit sampling plan created: ${plan.method} method, ${plan.actualSampleSize} items selected`,
      metadata: {
        plan_id: planData.id,
        test_type: plan.testType,
        method: plan.method,
        sample_size: plan.actualSampleSize,
        coverage_percentage: plan.coveragePercentage,
        fiscal_year: plan.fiscalYear
      }
    });

  if (logError) {
    console.warn('Failed to log sampling action:', logError);
  }
}

function generateCacheKey(payload: SamplingRequest): string {
  const keyData = {
    clientId: payload.clientId,
    fiscalYear: payload.fiscalYear,
    testType: payload.testType,
    method: payload.method,
    populationSize: payload.populationSize,
    confidenceLevel: payload.confidenceLevel,
    riskLevel: payload.riskLevel,
    seed: payload.seed
  };
  return btoa(JSON.stringify(keyData)).substring(0, 32);
}

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expires <= now) {
      cache.delete(key);
    }
  }
}