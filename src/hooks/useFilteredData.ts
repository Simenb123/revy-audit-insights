import { useMemo } from 'react';
import { useFilters, FilterState } from '@/contexts/FilterContext';

export interface TrialBalanceEntry {
  account_number: string;
  account_name: string;
  debit_balance?: number;
  credit_balance?: number;
  net_balance?: number;
  standard_account_type?: string;
  standard_name?: string;
  [key: string]: any;
}

export function useFilteredData<T extends TrialBalanceEntry>(data: T[]): T[] {
  const { filters } = useFilters();

  return useMemo(() => {
    if (!data || data.length === 0) return data;

    return data.filter((item) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const accountName = item.account_name?.toLowerCase() || '';
        const accountNumber = item.account_number?.toLowerCase() || '';
        if (!accountName.includes(searchLower) && !accountNumber.includes(searchLower)) {
          return false;
        }
      }

      // Cross-filter from widget interactions
      if (filters.crossFilter) {
        const { filterType, value } = filters.crossFilter;
        
        switch (filterType) {
          case 'category':
            if (item.standard_name !== value) {
              return false;
            }
            break;
          case 'account':
            if (item.account_number !== value && item.account_name !== value) {
              return false;
            }
            break;
          case 'amount_range':
            const balance = Math.abs(item.closing_balance || item.net_balance || item.debit_balance || item.credit_balance || 0);
            if (balance < value.min || balance > value.max) {
              return false;
            }
            break;
        }
      }

      // Account category filter
      if (filters.accountCategory) {
        const standardType = item.standard_account_type?.toLowerCase();
        switch (filters.accountCategory) {
          case 'asset':
            if (!standardType?.includes('asset')) return false;
            break;
          case 'liability':
            if (!standardType?.includes('liability')) return false;
            break;
          case 'equity':
            if (!standardType?.includes('equity')) return false;
            break;
          case 'revenue':
            if (!standardType?.includes('revenue') && !standardType?.includes('income')) return false;
            break;
          case 'expense':
            if (!standardType?.includes('expense') && !standardType?.includes('cost')) return false;
            break;
        }
      }

      // Account type filter (more specific than category)
      if (filters.accountType) {
        if (item.standard_account_type !== filters.accountType) {
          return false;
        }
      }

      // Date range filter would be applied here if we had date fields
      // For now, trial balance doesn't have transaction dates
      
      return true;
    });
  }, [data, filters]);
}

export function applyFiltersToAccountBalances(
  accountBalances: Record<string, number>,
  filters: FilterState,
  accountData?: TrialBalanceEntry[]
): Record<string, number> {
  if (!accountData || Object.keys(filters).length === 0) {
    return accountBalances;
  }

  // Filter the account data first
  const filteredAccounts = accountData.filter((item) => {
    // Apply same filters as useFilteredData
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const accountName = item.account_name?.toLowerCase() || '';
      const accountNumber = item.account_number?.toLowerCase() || '';
      if (!accountName.includes(searchLower) && !accountNumber.includes(searchLower)) {
        return false;
      }
    }

    // Cross-filter support
    if (filters.crossFilter) {
      const { filterType, value } = filters.crossFilter;
      
      switch (filterType) {
        case 'category':
          if (item.standard_name !== value) {
            return false;
          }
          break;
        case 'account':
          if (item.account_number !== value && item.account_name !== value) {
            return false;
          }
          break;
        case 'amount_range':
          const balance = Math.abs(item.closing_balance || item.net_balance || item.debit_balance || item.credit_balance || 0);
          if (balance < value.min || balance > value.max) {
            return false;
          }
          break;
      }
    }

    if (filters.accountCategory) {
      const standardType = item.standard_account_type?.toLowerCase();
      switch (filters.accountCategory) {
        case 'asset':
          if (!standardType?.includes('asset')) return false;
          break;
        case 'liability':
          if (!standardType?.includes('liability')) return false;
          break;
        case 'equity':
          if (!standardType?.includes('equity')) return false;
          break;
        case 'revenue':
          if (!standardType?.includes('revenue') && !standardType?.includes('income')) return false;
          break;
        case 'expense':
          if (!standardType?.includes('expense') && !standardType?.includes('cost')) return false;
          break;
      }
    }

    if (filters.accountType) {
      if (item.standard_account_type !== filters.accountType) {
        return false;
      }
    }

    return true;
  });

  // Recalculate balances based on filtered accounts
  const filteredBalances: Record<string, number> = {};
  
  filteredAccounts.forEach((account) => {
    const standardName = account.standard_name;
    if (standardName) {
      const balance = account.net_balance || account.debit_balance || account.credit_balance || 0;
      filteredBalances[standardName] = (filteredBalances[standardName] || 0) + balance;
    }
  });

  return filteredBalances;
}