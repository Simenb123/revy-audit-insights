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
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    onMutate: async (variables) => {
      const { clientId, accountNumber, statementLineNumber } = variables;

      // Cancel outgoing refetches for this client's mappings
      await queryClient.cancelQueries({ queryKey: ['trial-balance-mappings', clientId] });

      // Snapshot previous mappings
      const prevMappings = queryClient.getQueryData<TrialBalanceMapping[]>(['trial-balance-mappings', clientId]);

      // Optimistically update mappings cache
      if (prevMappings) {
        const exists = prevMappings.find(m => m.account_number === accountNumber);
        const next: TrialBalanceMapping[] = exists
          ? prevMappings.map(m => m.account_number === accountNumber ? { ...m, statement_line_number: statementLineNumber, updated_at: new Date().toISOString() } as any : m)
          : [
              ...prevMappings,
              {
                id: crypto.randomUUID?.() || `${clientId}-${accountNumber}`,
                client_id: clientId,
                account_number: accountNumber,
                statement_line_number: statementLineNumber,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as any,
            ];
        queryClient.setQueryData(['trial-balance-mappings', clientId], next);
      }

      // Optimistically update any aggregated TB queries
      const affectedTB = queryClient.getQueriesData<any>({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'trial-balance-with-mappings' && q.queryKey[1] === clientId,
      });
      const tbPrev: Array<{ key: any[]; data: any }> = [];
      affectedTB.forEach(([key, data]) => {
        tbPrev.push({ key: key as any[], data });
        if (!data?.trialBalanceEntries) return;
        const updated = {
          ...data,
          trialBalanceEntries: data.trialBalanceEntries.map((e: any) =>
            e.account_number === accountNumber
              ? { ...e, standard_number: statementLineNumber, is_mapped: true }
              : e
          ),
        };
        queryClient.setQueryData(key as any, updated);
      });

      return { prevMappings, tbPrev };
    },
    onError: (error: any, variables, context) => {
      // Rollback
      if (context?.prevMappings) {
        queryClient.setQueryData(['trial-balance-mappings', variables.clientId], context.prevMappings);
      }
      if (context?.tbPrev) {
        context.tbPrev.forEach(({ key, data }: any) => queryClient.setQueryData(key, data));
      }
      toast({
        title: "Feil ved lagring av mapping",
        description: error.message,
        variant: "destructive"
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Mapping lagret",
        description: `Konto ${data.account_number} mapped til regnskapslinje ${data.statement_line_number}`,
      });
    },
    onSettled: (_data, _err, variables) => {
      // Ensure caches are in sync
      queryClient.invalidateQueries({ queryKey: ['trial-balance-mappings', variables.clientId] });
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'trial-balance-with-mappings' && q.queryKey[1] === variables.clientId,
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