import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TrialBalanceMapping {
  id: string;
  client_id: string;
  account_number: string;
  statement_line_number: string;
  created_at: string;
  updated_at: string;
}

export function useTrialBalanceMappings(clientId: string) {
  return useQuery({
    queryKey: ['trial-balance-mappings', clientId],
    queryFn: async (): Promise<TrialBalanceMapping[]> => {
      const { data, error } = await supabase
        .from('trial_balance_mappings')
        .select('*')
        .eq('client_id', clientId)
        .order('account_number');

      if (error) {
        console.error('Error fetching trial balance mappings:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useSaveTrialBalanceMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      accountNumber, 
      statementLineNumber 
    }: { 
      clientId: string; 
      accountNumber: string; 
      statementLineNumber: string; 
    }) => {
      const { data, error } = await supabase
        .from('trial_balance_mappings')
        .upsert({
          client_id: clientId,
          account_number: accountNumber,
          statement_line_number: statementLineNumber
        }, {
          onConflict: 'client_id,account_number'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trial-balance-mappings', data.client_id] });
      toast({
        title: "Mapping lagret",
        description: `Konto ${data.account_number} mapped til regnskapslinje ${data.statement_line_number}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved lagring av mapping",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

export function useBulkSaveTrialBalanceMappings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      mappings 
    }: { 
      clientId: string; 
      mappings: Array<{ accountNumber: string; statementLineNumber: string }>;
    }) => {
      const mappingData = mappings.map(m => ({
        client_id: clientId,
        account_number: m.accountNumber,
        statement_line_number: m.statementLineNumber
      }));

      const { data, error } = await supabase
        .from('trial_balance_mappings')
        .upsert(mappingData, {
          onConflict: 'client_id,account_number'
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trial-balance-mappings', variables.clientId] });
      toast({
        title: "Bulk mapping fullført",
        description: `${data.length} mappinger ble lagret`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved bulk mapping",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}