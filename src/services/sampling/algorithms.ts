// Comprehensive audit sampling algorithms

import { 
  SamplingParams, 
  Transaction, 
  SampleItem, 
  SamplingResult, 
  Stratum 
} from './types';
import { 
  createSeededRNG, 
  getZScore, 
  getPoissonFactor, 
  getRiskFactor,
  getRiskWeightedAmount,
  generateParamHash,
  calculateSuggestedThreshold
} from './utils';

/**
 * Main function to generate audit sample
 */
export function generateAuditSample(
  transactions: Transaction[],
  params: SamplingParams
): SamplingResult {
  const rng = createSeededRNG(params.seed);
  
  // Step 1: Split into high-value (targeted) and residual populations
  const { targeted, residual, thresholdUsed } = splitByThreshold(transactions, params);
  
  // Step 2: Calculate recommended sample size for residual population
  const nBase = calculateBaseSampleSize(params, residual);
  const riskFactor = getRiskFactor(params.riskLevel, params.riskMatrix);
  const finalN = Math.ceil(nBase * riskFactor);
  
  // Step 3: Generate residual sample based on method
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
  
  // Step 4: Calculate coverage
  const totalSampleSum = [...targeted, ...residualSample].reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const coveragePercentage = (totalSampleSum / params.populationSum) * 100;
  
  // Step 5: Create result
  const result: SamplingResult = {
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
  
  return result;
}

/**
 * Split population by high-value threshold
 */
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

/**
 * Calculate base sample size before risk adjustment
 */
function calculateBaseSampleSize(params: SamplingParams, population: Transaction[]): number {
  if (params.testType === 'SUBSTANTIVE') {
    return calculateMUSSampleSize(params, population);
  } else {
    return calculateAttributeSampleSize(params, population);
  }
}

/**
 * Calculate MUS (Monetary Unit Sampling) sample size for substantive tests
 */
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

/**
 * Calculate attribute sample size for control tests using Cochran formula
 */
function calculateAttributeSampleSize(params: SamplingParams, population: Transaction[]): number {
  if (!params.tolerableDeviationRate || !params.expectedDeviationRate) {
    return Math.min(100, Math.max(30, Math.ceil(population.length * 0.05)));
  }
  
  const z = getZScore(params.confidenceLevel);
  const p = params.expectedDeviationRate / 100;
  const q = 1 - p;
  const e = (params.tolerableDeviationRate - params.expectedDeviationRate) / 100;
  
  // Basic Cochran formula
  const n0 = (z * z * p * q) / (e * e);
  
  // Finite population correction
  const n = n0 / (1 + (n0 - 1) / population.length);
  
  return Math.min(population.length, Math.max(30, Math.ceil(n)));
}

/**
 * Simple Random Sample (SRS)
 */
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

/**
 * Systematic sampling with random start
 */
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

/**
 * Monetary Unit Sampling (MUS) with risk weighting
 */
function musSelect(
  transactions: Transaction[],
  sampleSize: number,
  params: SamplingParams,
  rng: () => number
): SampleItem[] {
  // Filter out zero amounts
  const nonZeroTxs = transactions.filter(tx => Math.abs(tx.amount) > 0);
  
  if (nonZeroTxs.length === 0 || sampleSize <= 0) return [];
  
  // Calculate risk-weighted amounts and cumulative sums
  const cumulativeAmounts: number[] = [];
  let cumSum = 0;
  
  for (const tx of nonZeroTxs) {
    const weightedAmount = getRiskWeightedAmount(
      tx.amount,
      tx.risk_score || 0,
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
    
    // Find transaction containing this amount
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

/**
 * Stratified sampling with proportional allocation
 */
function stratifiedSample(
  transactions: Transaction[],
  sampleSize: number,
  params: SamplingParams,
  rng: () => number
): { sample: SampleItem[]; strata: Stratum[] } {
  if (!params.strataBounds || params.strataBounds.length === 0) {
    // Fall back to SRS if no strata defined
    return {
      sample: simpleRandomSample(transactions, sampleSize, rng),
      strata: []
    };
  }
  
  // Create strata based on bounds
  const strata = createStrata(transactions, params.strataBounds, params.minPerStratum);
  
  // Allocate sample size across strata
  allocateSampleAcrossStrata(strata, sampleSize, params.minPerStratum);
  
  // Generate samples for each stratum
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

/**
 * Create strata based on amount bounds
 */
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

/**
 * Allocate sample size across strata proportionally with minimum constraints
 */
function allocateSampleAcrossStrata(
  strata: Stratum[],
  totalSampleSize: number,
  minPerStratum: number
): void {
  // First, allocate minimum samples
  let remainingSampleSize = totalSampleSize;
  
  for (const stratum of strata) {
    if (stratum.transactions.length > 0) {
      const minAllocation = Math.min(minPerStratum, stratum.transactions.length);
      stratum.allocatedSampleSize = minAllocation;
      remainingSampleSize -= minAllocation;
    }
  }
  
  // Then, allocate remaining samples proportionally by weight (sum of amounts)
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
  
  // Final adjustment to ensure total equals requested sample size
  const actualTotal = strata.reduce((sum, stratum) => sum + stratum.allocatedSampleSize, 0);
  const adjustment = totalSampleSize - actualTotal;
  
  if (adjustment !== 0) {
    // Distribute adjustment across strata that have capacity
    const eligibleStrata = strata.filter(s => 
      adjustment > 0 ? s.allocatedSampleSize < s.transactions.length : s.allocatedSampleSize > s.minSampleSize
    );
    
    let remaining = Math.abs(adjustment);
    for (const stratum of eligibleStrata) {
      if (remaining === 0) break;
      
      if (adjustment > 0) {
        const canAdd = Math.min(remaining, stratum.transactions.length - stratum.allocatedSampleSize);
        stratum.allocatedSampleSize += canAdd;
        remaining -= canAdd;
      } else {
        const canSubtract = Math.min(remaining, stratum.allocatedSampleSize - stratum.minSampleSize);
        stratum.allocatedSampleSize -= canSubtract;
        remaining -= canSubtract;
      }
    }
  }
}

/**
 * Calculate suggested threshold amount
 */
export function calculateThresholdSuggestion(
  performanceMateriality: number,
  expectedMisstatement: number,
  confidenceFactor: number,
  riskFactor: number
): number {
  return calculateSuggestedThreshold(
    performanceMateriality,
    expectedMisstatement,
    confidenceFactor,
    riskFactor
  );
}