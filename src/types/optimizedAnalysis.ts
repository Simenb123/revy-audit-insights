export interface OptimizedAnalysisInput {
  clientId: string;
  datasetId?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface MonthlySummary {
  month: string;
  debit: number;
  credit: number;
  net: number;
}

export interface AccountDistribution {
  account: string;
  amount: number;
  count: number;
}

export interface TopAccount {
  account: string;
  net: number;
}

export type DataQualitySeverity = 'low' | 'med' | 'high';

export interface DataQualityFlag {
  code: string;
  severity: DataQualitySeverity;
  count: number;
  sampleIds: string[];
}

export interface TrialBalanceCrosscheck {
  balanced: boolean;
  diff: number;
}

export interface OptimizedAnalysisMetadata {
  client_id: string;
  dataset_id: string;
  generated_at: string;
}

export interface OptimizedAnalysisResult {
  total_transactions: number;
  date_range: DateRange;
  monthly_summary: MonthlySummary[];
  account_distribution: AccountDistribution[];
  top_accounts: TopAccount[];
  data_quality_flags: DataQualityFlag[];
  trial_balance_crosscheck: TrialBalanceCrosscheck;
  amount_statistics?: AmountStatistics; // New field for enhanced statistics
  overview?: OverviewStatistics; // New field for overview data
  metadata: OptimizedAnalysisMetadata;
}

export interface AmountStatistics {
  sum: number;
  average: number;
  min: number;
  max: number;
  positive_count: number;
  negative_count: number;
}

export interface OverviewStatistics {
  total_debit: number;
  total_credit: number;
  total_net: number;
}