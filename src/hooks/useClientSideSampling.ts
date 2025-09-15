import { useMemo } from 'react';
import { Transaction } from '@/hooks/useTransactions';

export interface SamplingParams {
  method: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED' | 'THRESHOLD';
  sampleSize?: number;
  confidenceLevel?: number;
  materiality?: number;
  expectedMisstatement?: number;
  tolerableDeviationRate?: number;
  expectedDeviationRate?: number;
  strataBounds?: number[];
  thresholdAmount?: number;
  coverageTarget?: number;
  seed?: number;
  useHighRiskInclusion?: boolean;
}

export interface SamplingResult {
  plan: {
    recommendedSampleSize: number;
    actualSampleSize: number;
    coveragePercentage: number;
    method: string;
    testType: string;
    generatedAt: string;
  };
  sample: Transaction[];
  summary?: {
    totalCount: number;
    sampledCount: number;
    totalAmount: number;
    sampledAmount: number;
    coverage: number;
    method: string;
  };
}

export function useClientSideSampling(
  transactions: Transaction[] | undefined,
  params: SamplingParams
): SamplingResult | null {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return null;
    }

    const { method, sampleSize = 30, thresholdAmount = 10000, coverageTarget = 30 } = params;
    
    let selectedTransactions: Transaction[] = [];
    let recommendedSize = sampleSize;

    // Calculate total population statistics
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.net_amount || 0), 0);
    const totalCount = transactions.length;

    switch (method) {
      case 'SRS': {
        // Simple Random Sampling
        const shuffled = [...transactions].sort(() => Math.random() - 0.5);
        selectedTransactions = shuffled.slice(0, sampleSize);
        break;
      }

      case 'SYSTEMATIC': {
        // Systematic Sampling
        const interval = Math.floor(transactions.length / sampleSize);
        const start = Math.floor(Math.random() * interval);
        
        for (let i = start; i < transactions.length && selectedTransactions.length < sampleSize; i += interval) {
          selectedTransactions.push(transactions[i]);
        }
        break;
      }

      case 'MUS': {
        // Monetary Unit Sampling - select based on cumulative amounts
        const sortedByAmount = [...transactions].sort((a, b) => 
          Math.abs(b.net_amount || 0) - Math.abs(a.net_amount || 0)
        );
        
        let cumulativeAmount = 0;
        const targetAmount = totalAmount * (coverageTarget / 100);
        
        for (const transaction of sortedByAmount) {
          if (cumulativeAmount >= targetAmount) break;
          selectedTransactions.push(transaction);
          cumulativeAmount += Math.abs(transaction.net_amount || 0);
        }
        break;
      }

      case 'STRATIFIED': {
        // Stratified Sampling - split into amount ranges
        const ranges = [
          { min: 0, max: 1000, portion: 0.2 },
          { min: 1000, max: 10000, portion: 0.3 },
          { min: 10000, max: 50000, portion: 0.3 },
          { min: 50000, max: Infinity, portion: 0.2 }
        ];

        ranges.forEach(range => {
          const rangeTransactions = transactions.filter(t => {
            const amount = Math.abs(t.net_amount || 0);
            return amount >= range.min && amount < range.max;
          });

          if (rangeTransactions.length > 0) {
            const strataSize = Math.ceil(sampleSize * range.portion);
            const shuffled = rangeTransactions.sort(() => Math.random() - 0.5);
            selectedTransactions.push(...shuffled.slice(0, Math.min(strataSize, rangeTransactions.length)));
          }
        });
        break;
      }

      case 'THRESHOLD': {
        // Threshold Sampling - all above threshold + random below
        const aboveThreshold = transactions.filter(t => Math.abs(t.net_amount || 0) >= thresholdAmount);
        const belowThreshold = transactions.filter(t => Math.abs(t.net_amount || 0) < thresholdAmount);
        
        selectedTransactions = [...aboveThreshold];
        
        // Add random sample from below threshold
        const remainingSize = Math.max(0, sampleSize - aboveThreshold.length);
        if (remainingSize > 0 && belowThreshold.length > 0) {
          const shuffled = belowThreshold.sort(() => Math.random() - 0.5);
          selectedTransactions.push(...shuffled.slice(0, Math.min(remainingSize, belowThreshold.length)));
        }
        break;
      }
    }

    // Calculate coverage
    const sampledAmount = selectedTransactions.reduce((sum, t) => sum + Math.abs(t.net_amount || 0), 0);
    const coveragePercentage = totalAmount > 0 ? (sampledAmount / totalAmount) * 100 : 0;

    return {
      plan: {
        recommendedSampleSize: recommendedSize,
        actualSampleSize: selectedTransactions.length,
        coveragePercentage,
        method,
        testType: 'SUBSTANTIVE',
        generatedAt: new Date().toISOString()
      },
      sample: selectedTransactions,
      summary: {
        totalCount,
        sampledCount: selectedTransactions.length,
        totalAmount,
        sampledAmount,
        coverage: coveragePercentage,
        method
      }
    };
  }, [transactions, params]);
}