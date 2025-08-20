// Utility functions for audit sampling

import { SamplingParams, RiskMatrix } from './types';

/**
 * Create a seeded random number generator for deterministic sampling
 */
export function createSeededRNG(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/**
 * Get Z-score for confidence level
 */
export function getZScore(confidenceLevel: number): number {
  switch (confidenceLevel) {
    case 99: return 2.58;
    case 95: return 1.96;
    case 90: return 1.65;
    default: return 1.96;
  }
}

/**
 * Get Poisson factor for MUS calculation
 */
export function getPoissonFactor(confidenceLevel: number): number {
  return -Math.log(1 - (confidenceLevel / 100));
}

/**
 * Calculate risk factor from risk matrix and level
 */
export function getRiskFactor(riskLevel: 'lav' | 'moderat' | 'hoy', riskMatrix: RiskMatrix): number {
  return riskMatrix[riskLevel];
}

/**
 * Calculate risk-weighted amount for MUS sampling
 */
export function getRiskWeightedAmount(
  amount: number, 
  riskScore: number = 0, 
  riskWeighting: 'disabled' | 'moderat' | 'hoy'
): number {
  const baseAmount = Math.abs(amount);
  
  if (riskWeighting === 'disabled') return baseAmount;
  
  const alpha = riskWeighting === 'moderat' ? 0.6 : 1.0;
  return baseAmount * (1 + alpha * riskScore);
}

/**
 * Generate deterministic parameter hash for caching
 */
export function generateParamHash(params: SamplingParams): string {
  // Sort keys for consistent hashing
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = (params as any)[key];
      return result;
    }, {} as any);
  
  return btoa(JSON.stringify(sortedParams))
    .replace(/[+/=]/g, '') // Remove special chars
    .substring(0, 16); // Keep first 16 chars
}

/**
 * Calculate suggested threshold using Excel-like formula
 */
export function calculateSuggestedThreshold(
  performanceMateriality: number,
  expectedMisstatement: number,
  confidenceFactor: number,
  riskFactor: number
): number {
  return (performanceMateriality - expectedMisstatement) / (confidenceFactor * riskFactor);
}

/**
 * Generate quantile-based strata bounds
 */
export function generateQuantileStrata(
  amounts: number[],
  numStrata: number = 4
): number[] {
  if (amounts.length === 0) return [];
  
  const sortedAmounts = amounts.map(Math.abs).sort((a, b) => a - b);
  const bounds: number[] = [];
  
  // Calculate cumulative sum
  const cumulativeSum = sortedAmounts.reduce((acc, amount, index) => {
    acc.push((acc[index - 1] || 0) + amount);
    return acc;
  }, [] as number[]);
  
  const totalSum = cumulativeSum[cumulativeSum.length - 1];
  
  // Find quantile boundaries (25%, 50%, 75%)
  for (let i = 1; i < numStrata; i++) {
    const targetSum = (totalSum * i) / numStrata;
    const boundIndex = cumulativeSum.findIndex(sum => sum >= targetSum);
    
    if (boundIndex >= 0) {
      const amount = sortedAmounts[boundIndex];
      // Round to nice numbers
      bounds.push(roundToNiceNumber(amount));
    }
  }
  
  return [...new Set(bounds)].sort((a, b) => a - b);
}

/**
 * Round to nice numbers for strata bounds
 */
function roundToNiceNumber(value: number): number {
  if (value <= 0) return 0;
  
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  
  let rounded: number;
  if (normalized <= 1) rounded = 1;
  else if (normalized <= 2) rounded = 2;
  else if (normalized <= 5) rounded = 5;
  else rounded = 10;
  
  return rounded * magnitude;
}

/**
 * Validate sampling parameters
 */
export function validateSamplingParams(params: SamplingParams): string[] {
  const errors: string[] = [];
  
  if (params.populationSize <= 0) {
    errors.push('Population size must be greater than 0');
  }
  
  if (params.populationSum <= 0) {
    errors.push('Population sum must be greater than 0');
  }
  
  if (params.testType === 'SUBSTANTIVE') {
    if (!params.materiality || params.materiality <= 0) {
      errors.push('Materiality is required for substantive tests');
    }
    if (params.expectedMisstatement && params.expectedMisstatement >= (params.materiality || 0)) {
      errors.push('Expected misstatement must be less than materiality');
    }
  }
  
  if (params.testType === 'CONTROL') {
    if (!params.tolerableDeviationRate || params.tolerableDeviationRate <= 0) {
      errors.push('Tolerable deviation rate is required for control tests');
    }
    if (params.expectedDeviationRate && params.expectedDeviationRate >= (params.tolerableDeviationRate || 0)) {
      errors.push('Expected deviation rate must be less than tolerable deviation rate');
    }
  }
  
  if (![90, 95, 99].includes(params.confidenceLevel)) {
    errors.push('Confidence level must be 90%, 95%, or 99%');
  }
  
  if (params.seed <= 0) {
    errors.push('Seed must be greater than 0');
  }
  
  return errors;
}

/**
 * Format currency for Norwegian locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format number with Norwegian locale
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format percentage for Norwegian locale
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'percent',
    minimumFractionDigits: decimals,  
    maximumFractionDigits: decimals
  }).format(value / 100);
}