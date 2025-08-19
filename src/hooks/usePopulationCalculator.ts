import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PopulationAccount {
  id: string;
  account_number: string;
  account_name: string;
  closing_balance: number;
  period_year: number;
  version?: string;
}

export interface PopulationResult {
  size: number;
  sum: number;
  accounts: PopulationAccount[];
  selectedStandardNumbers: string[];
  excludedAccountNumbers: string[];
  message?: string;
}

export const usePopulationCalculator = (
  clientId: string,
  fiscalYear: number,
  selectedStandardNumbers: string[],
  excludedAccountNumbers: string[] = [],
  version?: string
) => {
  return useQuery({
    queryKey: ['population-calculator', clientId, fiscalYear, selectedStandardNumbers, excludedAccountNumbers, version],
    queryFn: async (): Promise<PopulationResult> => {
      if (!clientId || !fiscalYear || selectedStandardNumbers.length === 0) {
        return {
          size: 0,
          sum: 0,
          accounts: [],
          selectedStandardNumbers,
          excludedAccountNumbers,
          message: 'Missing required parameters'
        };
      }

      const { data, error } = await supabase.functions.invoke('calculate-population-from-accounts', {
        body: {
          clientId,
          fiscalYear,
          selectedStandardNumbers,
          excludedAccountNumbers,
          version
        }
      });

      if (error) {
        console.error('Population calculation error:', error);
        throw error;
      }

      return data as PopulationResult;
    },
    enabled: !!clientId && !!fiscalYear && selectedStandardNumbers.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
};