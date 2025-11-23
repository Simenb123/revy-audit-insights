import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Types =============

interface SamplingParams {
  fiscalYear: number;
  testType: 'SUBSTANTIVE' | 'CONTROL';
  method: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED';
  populationSize: number;
  populationSum: number;
  materiality?: number;
  performanceMateriality?: number;
  expectedMisstatement?: number;
  confidenceLevel: number;
  riskLevel: 'lav' | 'moderat' | 'hoy';
  tolerableDeviationRate?: number;
  expectedDeviationRate?: number;
  thresholdMode: 'DISABLED' | 'PM' | 'TM' | 'CUSTOM';
  thresholdAmount?: number;
  confidenceFactor: number;
  strataBounds?: number[];
  minPerStratum: number;
  riskMatrix: RiskMatrix;
  riskWeighting: 'disabled' | 'moderat' | 'hoy';
  seed: number;
}

interface RiskMatrix {
  lav: number;
  moderat: number;
  hoy: number;
}

interface Transaction {
  id: string;
  transaction_date: string;
  account_no: string;
  account_name: string;
  description: string;
  amount: number;
  risk_score?: number;
  voucher_number?: string;
}

interface SampleItem extends Transaction {
  sample_type: 'TARGETED' | 'RESIDUAL';
  stratum_id?: number;
  selection_method?: string;
  rank?: number;
}

interface Stratum {
  index: number;
  lowerBound: number;
  upperBound?: number;
  transactions: Transaction[];
  allocatedSampleSize: number;
  minSampleSize: number;
  weightFactor: number;
}

// ============= Utility Functions =============

function createSeededRNG(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function getZScore(confidenceLevel: number): number {
  switch (confidenceLevel) {
    case 99: return 2.58;
    case 95: return 1.96;
    case 90: return 1.65;
    default: return 1.96;
  }
}

function getPoissonFactor(confidenceLevel: number): number {
  return -Math.log(1 - (confidenceLevel / 100));
}

function getRiskFactor(riskLevel: 'lav' | 'moderat' | 'hoy', riskMatrix: RiskMatrix): number {
  return riskMatrix[riskLevel];
}

function getRiskWeightedAmount(
  amount: number, 
  riskScore: number = 0, 
  riskWeighting: 'disabled' | 'moderat' | 'hoy'
): number {
  const baseAmount = Math.abs(amount);
  if (riskWeighting === 'disabled') return baseAmount;
  const alpha = riskWeighting === 'moderat' ? 0.6 : 1.0;
  return baseAmount * (1 + alpha * riskScore);
}

function generateParamHash(params: SamplingParams): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = (params as any)[key];
      return result;
    }, {} as any);
  
  return btoa(JSON.stringify(sortedParams))
    .replace(/[+/=]/g, '')
    .substring(0, 16);
}

function calculateTransactionRiskScore(tx: Transaction): number {
  // Simple risk scoring based on amount and characteristics
  const amount = Math.abs(tx.amount);
  let score = 0;
  
  // Amount-based risk
  if (amount > 100000) score += 0.3;
  else if (amount > 50000) score += 0.2;
  else if (amount > 10000) score += 0.1;
  
  // Round number risk
  if (amount % 1000 === 0) score += 0.1;
  
  // Description-based risk (simple keyword matching)
  const desc = tx.description?.toLowerCase() || '';
  if (desc.includes('kontant') || desc.includes('cash')) score += 0.2;
  if (desc.includes('justering') || desc.includes('adjustment')) score += 0.15;
  
  return Math.min(score, 1.0);
}

// ============= Sampling Algorithms =============

function splitByThreshold(
  transactions: Transaction[],
  params: SamplingParams
): { targeted: Transaction[]; residual: Transaction[]; thresholdUsed?: number } {
  if (params.thresholdMode === 'DISABLED') {
    return { targeted: [], residual: transactions };
  }
  
  let threshold: number;
  
  switch (params.thresholdMode) {
    case 'PM':
      threshold = params.performanceMateriality || 0;
      break;
    case 'TM':
      threshold = params.materiality || 0;
      break;
    case 'CUSTOM':
      threshold = params.thresholdAmount || 0;
      break;
    default:
      return { targeted: [], residual: transactions };
  }
  
  const targeted = transactions.filter(tx => Math.abs(tx.amount) >= threshold);
  const residual = transactions.filter(tx => Math.abs(tx.amount) < threshold);
  
  return { targeted, residual, thresholdUsed: threshold };
}

function calculateMUSSampleSize(params: SamplingParams, population: Transaction[]): number {
  if (!params.materiality || !params.expectedMisstatement) {
    return Math.min(100, Math.max(30, Math.ceil(population.length * 0.05)));
  }
  
  const populationSum = population.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const poissonFactor = getPoissonFactor(params.confidenceLevel);
  const expectedErrorFactor = params.expectedMisstatement / params.materiality;
  
  const sampleSize = Math.ceil(
    (populationSum / params.materiality) * 
    (poissonFactor + expectedErrorFactor)
  );
  
  return Math.min(population.length, Math.max(30, sampleSize));
}

function calculateAttributeSampleSize(params: SamplingParams, population: Transaction[]): number {
  if (!params.tolerableDeviationRate || !params.expectedDeviationRate) {
    return Math.min(100, Math.max(30, Math.ceil(population.length * 0.05)));
  }
  
  const z = getZScore(params.confidenceLevel);
  const p = params.expectedDeviationRate / 100;
  const q = 1 - p;
  const e = (params.tolerableDeviationRate - params.expectedDeviationRate) / 100;
  
  const n0 = (z * z * p * q) / (e * e);
  const n = n0 / (1 + (n0 - 1) / population.length);
  
  return Math.min(population.length, Math.max(30, Math.ceil(n)));
}

function simpleRandomSample(
  transactions: Transaction[],
  sampleSize: number,
  rng: () => number
): SampleItem[] {
  if (sampleSize >= transactions.length) {
    return transactions.map(tx => ({ ...tx, sample_type: 'RESIDUAL' as const }));
  }
  
  const shuffled = [...transactions].sort(() => rng() - 0.5);
  return shuffled.slice(0, sampleSize).map(tx => ({ 
    ...tx, 
    sample_type: 'RESIDUAL' as const,
    selection_method: 'SRS'
  }));
}

function systematicSample(
  transactions: Transaction[],
  sampleSize: number,
  rng: () => number
): SampleItem[] {
  if (sampleSize >= transactions.length) {
    return transactions.map(tx => ({ ...tx, sample_type: 'RESIDUAL' as const }));
  }
  
  const interval = Math.floor(transactions.length / sampleSize);
  if (interval <= 0) return [];
  
  const start = Math.floor(rng() * interval);
  const sample: SampleItem[] = [];
  
  for (let i = 0; i < sampleSize; i++) {
    const index = (start + i * interval) % transactions.length;
    sample.push({
      ...transactions[index],
      sample_type: 'RESIDUAL' as const,
      selection_method: 'SYSTEMATIC',
      rank: i + 1
    });
  }
  
  return sample;
}

function musSelect(
  transactions: Transaction[],
  sampleSize: number,
  params: SamplingParams,
  rng: () => number
): SampleItem[] {
  const nonZeroTxs = transactions.filter(tx => Math.abs(tx.amount) > 0);
  
  if (nonZeroTxs.length === 0 || sampleSize <= 0) return [];
  
  const cumulativeAmounts: number[] = [];
  let cumSum = 0;
  
  for (const tx of nonZeroTxs) {
    const riskScore = tx.risk_score || calculateTransactionRiskScore(tx);
    const weightedAmount = getRiskWeightedAmount(
      tx.amount,
      riskScore,
      params.riskWeighting
    );
    cumSum += weightedAmount;
    cumulativeAmounts.push(cumSum);
  }
  
  const totalSum = cumSum;
  const interval = totalSum / sampleSize;
  const sample: SampleItem[] = [];
  const selectedIds = new Set<string>();
  
  for (let i = 0; i < sampleSize; i++) {
    const randomStart = rng() * interval;
    const targetAmount = randomStart + i * interval;
    
    const index = cumulativeAmounts.findIndex(amount => amount >= targetAmount);
    
    if (index >= 0 && !selectedIds.has(nonZeroTxs[index].id)) {
      selectedIds.add(nonZeroTxs[index].id);
      sample.push({
        ...nonZeroTxs[index],
        sample_type: 'RESIDUAL' as const,
        selection_method: 'MUS',
        rank: i + 1
      });
    }
  }
  
  return sample;
}

function createStrata(
  transactions: Transaction[],
  bounds: number[],
  minPerStratum: number
): Stratum[] {
  const sortedBounds = [0, ...bounds.sort((a, b) => a - b), Infinity];
  const strata: Stratum[] = [];
  
  for (let i = 0; i < sortedBounds.length - 1; i++) {
    const lowerBound = sortedBounds[i];
    const upperBound = sortedBounds[i + 1];
    
    const stratumTransactions = transactions.filter(tx => {
      const amount = Math.abs(tx.amount);
      return amount >= lowerBound && (upperBound === Infinity ? true : amount < upperBound);
    });
    
    strata.push({
      index: i,
      lowerBound,
      upperBound: upperBound === Infinity ? undefined : upperBound,
      transactions: stratumTransactions,
      allocatedSampleSize: 0,
      minSampleSize: minPerStratum,
      weightFactor: 1.0
    });
  }
  
  return strata;
}

function allocateSampleAcrossStrata(
  strata: Stratum[],
  totalSampleSize: number,
  minPerStratum: number
): void {
  let remainingSampleSize = totalSampleSize;
  
  for (const stratum of strata) {
    if (stratum.transactions.length > 0) {
      const minAllocation = Math.min(minPerStratum, stratum.transactions.length);
      stratum.allocatedSampleSize = minAllocation;
      remainingSampleSize -= minAllocation;
    }
  }
  
  if (remainingSampleSize > 0) {
    const totalWeight = strata.reduce((sum, stratum) => {
      return sum + stratum.transactions.reduce((stratumSum, tx) => 
        stratumSum + Math.abs(tx.amount), 0
      );
    }, 0);
    
    if (totalWeight > 0) {
      for (const stratum of strata) {
        if (stratum.transactions.length > 0) {
          const stratumWeight = stratum.transactions.reduce((sum, tx) => 
            sum + Math.abs(tx.amount), 0
          );
          
          const proportionalAllocation = Math.round(
            (stratumWeight / totalWeight) * remainingSampleSize
          );
          
          const maxPossible = stratum.transactions.length - stratum.allocatedSampleSize;
          stratum.allocatedSampleSize += Math.min(proportionalAllocation, maxPossible);
        }
      }
    }
  }
}

function stratifiedSample(
  transactions: Transaction[],
  sampleSize: number,
  params: SamplingParams,
  rng: () => number
): { sample: SampleItem[]; strata: Stratum[] } {
  if (!params.strataBounds || params.strataBounds.length === 0) {
    return {
      sample: simpleRandomSample(transactions, sampleSize, rng),
      strata: []
    };
  }
  
  const strata = createStrata(transactions, params.strataBounds, params.minPerStratum);
  allocateSampleAcrossStrata(strata, sampleSize, params.minPerStratum);
  
  const sample: SampleItem[] = [];
  
  for (const stratum of strata) {
    if (stratum.allocatedSampleSize > 0 && stratum.transactions.length > 0) {
      const stratumSample = simpleRandomSample(
        stratum.transactions,
        stratum.allocatedSampleSize,
        rng
      ).map(tx => ({ 
        ...tx, 
        stratum_id: stratum.index,
        selection_method: 'STRATIFIED'
      }));
      
      sample.push(...stratumSample);
    }
  }
  
  return { sample, strata };
}

function generateAuditSample(
  transactions: Transaction[],
  params: SamplingParams
) {
  console.log('[generate-audit-sample] Starting sample generation', {
    method: params.method,
    populationSize: transactions.length,
    seed: params.seed
  });

  const rng = createSeededRNG(params.seed);
  
  const { targeted, residual, thresholdUsed } = splitByThreshold(transactions, params);
  
  console.log('[generate-audit-sample] Split by threshold', {
    targeted: targeted.length,
    residual: residual.length,
    thresholdUsed
  });
  
  const nBase = params.testType === 'SUBSTANTIVE' 
    ? calculateMUSSampleSize(params, residual)
    : calculateAttributeSampleSize(params, residual);
    
  const riskFactor = getRiskFactor(params.riskLevel, params.riskMatrix);
  const finalN = Math.ceil(nBase * riskFactor);
  
  console.log('[generate-audit-sample] Sample size calculation', {
    nBase,
    riskFactor,
    finalN
  });
  
  let residualSample: SampleItem[];
  let strata: Stratum[] | undefined;
  
  switch (params.method) {
    case 'SRS':
      residualSample = simpleRandomSample(residual, finalN, rng);
      break;
    case 'SYSTEMATIC':
      residualSample = systematicSample(residual, finalN, rng);
      break;
    case 'MUS':
      residualSample = musSelect(residual, finalN, params, rng);
      break;
    case 'STRATIFIED':
      const result = stratifiedSample(residual, finalN, params, rng);
      residualSample = result.sample;
      strata = result.strata;
      break;
    default:
      throw new Error(`Unsupported sampling method: ${params.method}`);
  }
  
  const totalSampleSum = [...targeted, ...residualSample].reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const coveragePercentage = (totalSampleSum / params.populationSum) * 100;
  
  console.log('[generate-audit-sample] Sample generated', {
    targetedCount: targeted.length,
    residualCount: residualSample.length,
    coverage: coveragePercentage
  });
  
  return {
    plan: {
      recommendedSampleSize: nBase,
      actualSampleSize: targeted.length + residualSample.length,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      method: params.method,
      testType: params.testType,
      generatedAt: new Date().toISOString(),
      paramHash: generateParamHash(params),
      seed: params.seed
    },
    samples: {
      targeted: targeted.map(tx => ({ ...tx, sample_type: 'TARGETED' as const })),
      residual: residualSample,
      total: [
        ...targeted.map(tx => ({ ...tx, sample_type: 'TARGETED' as const })),
        ...residualSample
      ]
    },
    strata,
    metadata: {
      thresholdUsed,
      strataBounds: params.strataBounds,
      riskMatrixUsed: params.riskMatrix,
      calculations: {
        nBase,
        riskFactor,
        finalN
      }
    }
  };
}

// ============= Main Handler =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-audit-sample] Request received');

    const { clientId, versionId, params } = await req.json();

    if (!clientId || !versionId || !params) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: clientId, versionId, params' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[generate-audit-sample] Fetching transactions', { clientId, versionId });

    // Fetch transactions from database
    const { data: transactions, error: fetchError } = await supabase
      .from('general_ledger_transactions')
      .select(`
        id,
        transaction_date,
        description,
        debit_amount,
        credit_amount,
        voucher_number,
        client_account_id,
        client_chart_of_accounts!inner (
          account_number,
          account_name
        )
      `)
      .eq('client_id', clientId)
      .eq('version_id', versionId);

    if (fetchError) {
      console.error('[generate-audit-sample] Error fetching transactions:', fetchError);
      return new Response(
        JSON.stringify({ error: `Database error: ${fetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No transactions found for the specified client and version' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-audit-sample] Transactions fetched', { count: transactions.length });

    // Transform transactions to expected format
    const formattedTransactions: Transaction[] = transactions.map((tx: any) => ({
      id: tx.id,
      transaction_date: tx.transaction_date,
      account_no: tx.client_chart_of_accounts?.account_number || 'UNKNOWN',
      account_name: tx.client_chart_of_accounts?.account_name || 'Unknown',
      description: tx.description || '',
      amount: (tx.debit_amount || 0) - (tx.credit_amount || 0),
      voucher_number: tx.voucher_number
    }));

    // Generate sample
    const result = generateAuditSample(formattedTransactions, params as SamplingParams);

    console.log('[generate-audit-sample] Sample generated successfully');

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[generate-audit-sample] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
