import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IncomeStatement {
  revenue: {
    total: number;
    accounts: Array<{
      account_number: string;
      account_name: string;
      amount: number;
    }>;
  };
  expenses: {
    total: number;
    accounts: Array<{
      account_number: string;
      account_name: string;
      amount: number;
    }>;
  };
  net_income: number;
  period_start: string;
  period_end: string;
  generated_at: string;
}

export interface BalanceSheet {
  assets: {
    total: number;
    accounts: Array<{
      account_number: string;
      account_name: string;
      amount: number;
    }>;
  };
  liabilities: {
    total: number;
    accounts: Array<{
      account_number: string;
      account_name: string;
      amount: number;
    }>;
  };
  equity: {
    total: number;
    accounts: Array<{
      account_number: string;
      account_name: string;
      amount: number;
    }>;
  };
  as_of_date: string;
  generated_at: string;
}

export const useIncomeStatement = (
  clientId: string,
  periodStart: string,
  periodEnd: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ['income-statement', clientId, periodStart, periodEnd],
    queryFn: async (): Promise<IncomeStatement> => {
      const { data, error } = await supabase.rpc('generate_income_statement', {
        p_client_id: clientId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      });

      if (error) throw error;
      return data as unknown as IncomeStatement;
    },
    enabled: enabled && !!clientId && !!periodStart && !!periodEnd,
  });
};

export const useBalanceSheet = (
  clientId: string,
  asOfDate: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ['balance-sheet', clientId, asOfDate],
    queryFn: async (): Promise<BalanceSheet> => {
      const { data, error } = await supabase.rpc('generate_balance_sheet', {
        p_client_id: clientId,
        p_as_of_date: asOfDate,
      });

      if (error) throw error;
      return data as unknown as BalanceSheet;
    },
    enabled: enabled && !!clientId && !!asOfDate,
  });
};

export const useCleanupExpiredReports = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('cleanup_expired_financial_reports');
      if (error) throw error;
      return data;
    },
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ['financial-reports'] });
      toast.success(`Slettet ${deletedCount} utløpte rapporter`);
    },
    onError: (error) => {
      console.error('Error cleaning up reports:', error);
      toast.error('Feil ved opprydding av rapporter');
    },
  });
};