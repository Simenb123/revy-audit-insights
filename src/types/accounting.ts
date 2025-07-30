// Separate, focused interfaces for accounting data types

export interface GLVersionOption {
  id: string;
  label: string;
  version_number: number;
  file_name: string;
  is_active: boolean;
  created_at: string;
  total_transactions: number;
}

export interface TBVersionOption {
  id: string;
  label: string;
  version: string;
  period_year: number;
  created_at: string;
  account_count: number;
}

// Common interface for version selection components
export interface VersionOption {
  id: string;
  label: string;
  created_at: string;
}