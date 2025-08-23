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
 * Validate sampling parameters with enhanced business rules
 */
export function validateSamplingParams(params: SamplingParams): string[] {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (params.populationSize <= 0) {
    errors.push('Population size must be greater than 0');
  }
  
  if (params.populationSum <= 0) {
    errors.push('Population sum must be greater than 0');
  }
  
  // Test type specific validation
  if (params.testType === 'SUBSTANTIVE') {
    if (!params.materiality || params.materiality <= 0) {
      errors.push('Materiality is required for substantive tests');
    }
    
    if (params.expectedMisstatement && params.materiality) {
      if (params.expectedMisstatement >= params.materiality) {
        errors.push('Expected misstatement must be less than materiality');
      }
      
      // Warning for high expected misstatement ratios
      const ratio = params.expectedMisstatement / params.materiality;
      if (ratio > 0.5) {
        warnings.push('Expected misstatement is more than 50% of materiality - consider reviewing assumptions');
      }
    }
    
    // Performance materiality validation
    if (params.performanceMateriality && params.materiality) {
      if (params.performanceMateriality > params.materiality) {
        errors.push('Performance materiality cannot exceed total materiality');
      }
      
      const pmRatio = params.performanceMateriality / params.materiality;
      if (pmRatio < 0.5 || pmRatio > 0.9) {
        warnings.push('Performance materiality should typically be 50-90% of total materiality');
      }
    }
  }
  
  if (params.testType === 'CONTROL') {
    if (!params.tolerableDeviationRate || params.tolerableDeviationRate <= 0) {
      errors.push('Tolerable deviation rate is required for control tests');
    }
    
    if (params.tolerableDeviationRate && params.tolerableDeviationRate > 20) {
      warnings.push('Tolerable deviation rate above 20% may indicate weak control design');
    }
    
    if (params.expectedDeviationRate && params.tolerableDeviationRate) {
      if (params.expectedDeviationRate >= params.tolerableDeviationRate) {
        errors.push('Expected deviation rate must be less than tolerable deviation rate');
      }
      
      const deviationRatio = params.expectedDeviationRate / params.tolerableDeviationRate;
      if (deviationRatio > 0.7) {
        warnings.push('Expected deviation rate is close to tolerable rate - sample size may be very large');
      }
    }
  }
  
  // Confidence level validation
  if (![90, 95, 99].includes(params.confidenceLevel)) {
    errors.push('Confidence level must be 90%, 95%, or 99%');
  }
  
  // Risk level validation
  if (!['lav', 'moderat', 'hoy'].includes(params.riskLevel)) {
    errors.push('Risk level must be "lav", "moderat", or "hoy"');
  }
  
  // Seed validation
  if (params.seed <= 0) {
    errors.push('Seed must be greater than 0');
  }
  
  // Method-specific validation
  if (params.method === 'STRATIFIED') {
    if (!params.strataBounds || params.strataBounds.length === 0) {
      warnings.push('Stratified sampling requires strata bounds to be effective');
    }
    
    if (params.minPerStratum < 1) {
      warnings.push('Minimum per stratum should be at least 1 for meaningful stratification');
    }
  }
  
  // Threshold validation
  if (params.thresholdMode !== 'DISABLED') {
    let threshold = 0;
    
    switch (params.thresholdMode) {
      case 'PM':
        if (!params.performanceMateriality) {
          errors.push('Performance materiality required for PM threshold mode');
        }
        threshold = params.performanceMateriality || 0;
        break;
      case 'TM':
        if (!params.materiality) {
          errors.push('Total materiality required for TM threshold mode');
        }
        threshold = params.materiality || 0;
        break;
      case 'CUSTOM':
        if (!params.thresholdAmount || params.thresholdAmount <= 0) {
          errors.push('Threshold amount required for custom threshold mode');
        }
        threshold = params.thresholdAmount || 0;
        break;
    }
    
    // Check if threshold is reasonable relative to population
    if (threshold > 0 && params.populationSum > 0) {
      const thresholdRatio = threshold / params.populationSum;
      if (thresholdRatio > 0.5) {
        warnings.push('High threshold may capture too many transactions as targeted items');
      }
    }
  }
  
  // Cross-validation checks
  if (params.populationSize > 0 && params.populationSum > 0) {
    const avgAmount = params.populationSum / params.populationSize;
    
    if (params.materiality && avgAmount > params.materiality * 2) {
      warnings.push('Average transaction amount is significantly higher than materiality');
    }
  }
  
  // Log warnings to console for development
  if (warnings.length > 0) {
    console.warn('Sampling parameter warnings:', warnings);
  }
  
  // Return only errors for now, but warnings are available for UI components
  return errors;
}

/**
 * Get validation warnings separately for UI display
 */
export function getSamplingValidationWarnings(params: SamplingParams): string[] {
  const warnings: string[] = [];
  
  // Test type specific warnings
  if (params.testType === 'SUBSTANTIVE') {
    if (params.expectedMisstatement && params.materiality) {
      const ratio = params.expectedMisstatement / params.materiality;
      if (ratio > 0.5) {
        warnings.push('Expected misstatement is more than 50% of materiality - consider reviewing assumptions');
      }
    }
    
    if (params.performanceMateriality && params.materiality) {
      const pmRatio = params.performanceMateriality / params.materiality;
      if (pmRatio < 0.5 || pmRatio > 0.9) {
        warnings.push('Performance materiality should typically be 50-90% of total materiality');
      }
    }
  }
  
  if (params.testType === 'CONTROL') {
    if (params.tolerableDeviationRate && params.tolerableDeviationRate > 20) {
      warnings.push('Tolerable deviation rate above 20% may indicate weak control design');
    }
    
    if (params.expectedDeviationRate && params.tolerableDeviationRate) {
      const deviationRatio = params.expectedDeviationRate / params.tolerableDeviationRate;
      if (deviationRatio > 0.7) {
        warnings.push('Expected deviation rate is close to tolerable rate - sample size may be very large');
      }
    }
  }
  
  // Method-specific warnings
  if (params.method === 'STRATIFIED') {
    if (!params.strataBounds || params.strataBounds.length === 0) {
      warnings.push('Stratified sampling requires strata bounds to be effective');
    }
    
    if (params.minPerStratum < 1) {
      warnings.push('Minimum per stratum should be at least 1 for meaningful stratification');
    }
  }
  
  // Threshold warnings
  if (params.thresholdMode !== 'DISABLED') {
    let threshold = 0;
    
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
    }
    
    if (threshold > 0 && params.populationSum > 0) {
      const thresholdRatio = threshold / params.populationSum;
      if (thresholdRatio > 0.5) {
        warnings.push('High threshold may capture too many transactions as targeted items');
      }
    }
  }
  
  // Cross-validation warnings
  if (params.populationSize > 0 && params.populationSum > 0) {
    const avgAmount = params.populationSum / params.populationSize;
    
    if (params.materiality && avgAmount > params.materiality * 2) {
      warnings.push('Average transaction amount is significantly higher than materiality');
    }
  }
  
  return warnings;
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