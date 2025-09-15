import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

// Hook for mapping standard numbers to actual account numbers
export function useAccountNumberMapping(
  clientId: string,
  selectedStandardNumbers: string[],
  versionKey?: string
) {
  // 1. Hent kontoplan for versjonen
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['chart-of-accounts-with-standards', clientId, versionKey],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.debug('[Account Mapping] Fetching accounts for client:', clientId, 'version:', versionKey);
      
      const { data, error } = await supabase
        .from('client_chart_of_accounts')
        .select('id, client_id, account_number, account_name, is_active')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('account_number');

      if (error) {
        console.error('[Account Mapping] Error fetching accounts:', error);
        throw error;
      }

      console.debug('[Account Mapping] Fetched', data?.length || 0, 'accounts');
      return data || [];
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // 2. Hent mappings fra trial_balance_mappings
  const { data: mappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ['trial-balance-mappings', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.debug('[Account Mapping] Fetching mappings for client:', clientId);
      
      const { data, error } = await supabase
        .from('trial_balance_mappings')
        .select('account_number, statement_line_number')
        .eq('client_id', clientId);

      if (error) {
        console.error('[Account Mapping] Error fetching mappings:', error);
        throw error;
      }

      console.debug('[Account Mapping] Fetched', data?.length || 0, 'mappings');
      return data || [];
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // 3. Bygg populasjon (kontonumre) basert på mappinger
  const populationAccountNumbers = useMemo(() => {
    if (!mappings || selectedStandardNumbers.length === 0) {
      console.debug('[Account Mapping] No mappings or selected standards');
      return [];
    }

    const accountSet = new Set<string>();
    
    // Map standardnumre til kontonumre via trial_balance_mappings
    mappings.forEach(mapping => {
      if (selectedStandardNumbers.includes(mapping.statement_line_number)) {
        accountSet.add(mapping.account_number);
      }
    });

    const mappedAccounts = [...accountSet].sort();
    console.debug('[Account Mapping] Selected standards:', selectedStandardNumbers);
    console.debug('[Account Mapping] Found', mappedAccounts.length, 'mapped accounts:', mappedAccounts.slice(0, 10), mappedAccounts.length > 10 ? '...' : '');

    return mappedAccounts;
  }, [mappings, selectedStandardNumbers]);

  const isLoading = isLoadingAccounts || isLoadingMappings;
  
  console.debug('[Account Mapping] Result - loading:', isLoading, 'mapped accounts count:', populationAccountNumbers.length);

  return {
    populationAccountNumbers,
    isLoading,
    hasData: populationAccountNumbers.length > 0,
    accountsData: accounts || [],
    mappingsData: mappings || []
  };
}