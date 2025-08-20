// Core types for the comprehensive audit sampling system

export interface SamplingParams {
  fiscalYear: number;
  testType: 'SUBSTANTIVE' | 'CONTROL';
  method: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED';
  populationSize: number;
  populationSum: number;
  
  // Enhanced parameters
  materiality?: number;
  performanceMateriality?: number;
  expectedMisstatement?: number;
  confidenceLevel: number; // 90, 95, 99
  riskLevel: 'lav' | 'moderat' | 'hoy';
  
  // Control test parameters
  tolerableDeviationRate?: number;
  expectedDeviationRate?: number;
  
  // High-value threshold parameters
  thresholdMode: 'DISABLED' | 'PM' | 'TM' | 'CUSTOM';
  thresholdAmount?: number;
  confidenceFactor: number; // For threshold calculation
  
  // Stratification parameters
  strataBounds?: number[];
  minPerStratum: number;
  
  // Risk and seed parameters
  riskMatrix: RiskMatrix;
  riskWeighting: 'disabled' | 'moderat' | 'hoy';
  seed: number;
}

export interface RiskMatrix {
  lav: number;    // e.g., 0.8
  moderat: number; // e.g., 1.0  
  hoy: number;    // e.g., 1.3
}

export interface Transaction {
  id: string;
  transaction_date: string;
  account_no: string;
  account_name: string;
  description: string;
  amount: number;
  risk_score?: number; // 0-1 scale
  voucher_number?: string;
}

export interface SampleItem extends Transaction {
  sample_type: 'TARGETED' | 'RESIDUAL';
  stratum_id?: number;
  selection_method?: string;
  rank?: number;
}

export interface Stratum {
  index: number;
  lowerBound: number;
  upperBound?: number;
  transactions: Transaction[];
  allocatedSampleSize: number;
  minSampleSize: number;
  weightFactor: number;
}

export interface SamplingResult {
  plan: {
    id?: string;
    recommendedSampleSize: number;
    actualSampleSize: number;
    coveragePercentage: number;
    method: string;
    testType: string;
    generatedAt: string;
    paramHash: string;
    seed: number;
  };
  samples: {
    targeted: SampleItem[];
    residual: SampleItem[];
    total: SampleItem[];
  };
  strata?: Stratum[];
  metadata: {
    thresholdUsed?: number;
    strataBounds?: number[];
    riskMatrixUsed: RiskMatrix;
    calculations: {
      nBase: number;
      riskFactor: number;
      finalN: number;
    };
  };
}

export interface ExportFormat {
  type: 'CSV' | 'JSON' | 'PDF';
  includeMetadata: boolean;
  includeParameters: boolean;
}

export interface SavedSamplingPlan {
  id: string;
  client_id: string;
  fiscal_year: number;
  test_type: string;
  method: string;
  population_size: number;
  population_sum: number;
  materiality?: number;
  performance_materiality?: number;
  expected_misstatement?: number;
  confidence_level: number;
  risk_level: string;
  tolerable_deviation_rate?: number;
  expected_deviation_rate?: number;
  strata_bounds?: number[];
  threshold_mode: string;
  threshold_amount?: number;
  min_per_stratum: number;
  risk_matrix: RiskMatrix;
  risk_weighting: string;
  confidence_factor: number;
  param_hash: string;
  seed: number;
  recommended_sample_size: number;
  actual_sample_size: number;
  coverage_percentage: number;
  plan_name?: string;
  notes?: string;
  metadata: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}