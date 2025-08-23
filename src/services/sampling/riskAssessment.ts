// Risk assessment utilities for audit sampling

import { Transaction, SamplingParams } from './types';

/**
 * Calculate risk score for a transaction based on various factors
 */
export function calculateTransactionRiskScore(
  transaction: Transaction,
  params: SamplingParams
): number {
  let riskScore = 0.1; // Base risk score
  
  const amount = Math.abs(transaction.amount);
  const accountNumber = transaction.account_no;
  const description = transaction.description?.toLowerCase() || '';
  
  // Amount-based risk factors
  if (params.materiality && amount > params.materiality * 0.5) {
    riskScore += 0.3; // High amount risk
  } else if (params.materiality && amount > params.materiality * 0.1) {
    riskScore += 0.15; // Medium amount risk
  }
  
  // Account-based risk factors (Norwegian chart of accounts)
  if (accountNumber.startsWith('1')) { // Eiendeler/Assets
    riskScore += 0.1;
  } else if (accountNumber.startsWith('2')) { // Gjeld/Liabilities  
    riskScore += 0.2;
  } else if (accountNumber.startsWith('3')) { // Inntekter/Revenue
    riskScore += 0.25;
  } else if (accountNumber.startsWith('4') || accountNumber.startsWith('5')) { // Kostnader/Expenses
    riskScore += 0.15;
  } else if (accountNumber.startsWith('6')) { // Finansposter/Financial items
    riskScore += 0.3;
  } else if (accountNumber.startsWith('7')) { // Ekstraordinære poster/Extraordinary items
    riskScore += 0.4;
  }
  
  // Description-based risk (Norwegian accounting terms)
  const highRiskKeywords = [
    'mva', 'merverdiavgift', 'lån', 'rente', 'avskrivning', 'nedskrivning',
    'goodwill', 'valuta', 'derivat', 'sikring', 'pensjon', 'bonus',
    'estimat', 'avsetning', 'tap', 'gevinst'
  ];
  
  if (highRiskKeywords.some(keyword => description.includes(keyword))) {
    riskScore += 0.2;
  }
  
  // Date-based risk (transactions near year-end)
  const transactionDate = new Date(transaction.transaction_date);
  const yearEnd = new Date(params.fiscalYear, 11, 31); // December 31st
  const daysDiff = Math.abs((yearEnd.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 7) { // Within 7 days of year-end
    riskScore += 0.25;
  } else if (daysDiff <= 30) { // Within 30 days of year-end
    riskScore += 0.1;
  }
  
  return Math.min(1.0, riskScore); // Cap at 1.0
}

/**
 * Assess population risk characteristics
 */
export function assessPopulationRisk(
  transactions: Transaction[],
  params: SamplingParams
): {
  averageRiskScore: number;
  highRiskTransactionCount: number;
  riskDistribution: { low: number; medium: number; high: number };
} {
  const riskScores = transactions.map(tx => calculateTransactionRiskScore(tx, params));
  
  const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
  const highRiskTransactionCount = riskScores.filter(score => score > 0.7).length;
  
  const riskDistribution = {
    low: riskScores.filter(score => score <= 0.3).length,
    medium: riskScores.filter(score => score > 0.3 && score <= 0.7).length,
    high: riskScores.filter(score => score > 0.7).length
  };
  
  return {
    averageRiskScore,
    highRiskTransactionCount,
    riskDistribution
  };
}

/**
 * Get risk-based sampling recommendations
 */
export function getRiskBasedRecommendations(
  transactions: Transaction[],
  params: SamplingParams
): {
  recommendedRiskWeighting: 'disabled' | 'moderat' | 'hoy';
  recommendedMinPerStratum: number;
  warnings: string[];
} {
  const riskAssessment = assessPopulationRisk(transactions, params);
  const warnings: string[] = [];
  
  let recommendedRiskWeighting: 'disabled' | 'moderat' | 'hoy' = 'disabled';
  let recommendedMinPerStratum = 2;
  
  // Risk weighting recommendations
  if (riskAssessment.averageRiskScore > 0.6) {
    recommendedRiskWeighting = 'hoy';
    warnings.push('High average risk score detected - consider high risk weighting');
  } else if (riskAssessment.averageRiskScore > 0.4) {
    recommendedRiskWeighting = 'moderat';
  }
  
  // High risk transaction warnings
  const highRiskPercentage = (riskAssessment.highRiskTransactionCount / transactions.length) * 100;
  if (highRiskPercentage > 10) {
    warnings.push(`${Math.round(highRiskPercentage)}% of transactions are high risk - consider targeted testing`);
    recommendedMinPerStratum = Math.max(3, Math.ceil(highRiskPercentage / 10));
  }
  
  // Population size warnings
  if (transactions.length < 100) {
    warnings.push('Small population size - consider census testing instead of sampling');
  }
  
  return {
    recommendedRiskWeighting,
    recommendedMinPerStratum,
    warnings
  };
}