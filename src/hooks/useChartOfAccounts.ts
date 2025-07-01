
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ChartOfAccount {
  id: string;
  client_id: string;
  account_number: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_account_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StandardAccount {
  id: string;
  standard_number: string;
  standard_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category?: string;
  analysis_group?: string;
}

export interface AccountMapping {
  id: string;
  client_id: string;
  client_account_id: string;
  standard_account_id: string;
  mapping_confidence: number;
  is_manual_mapping: boolean;
  client_account?: ChartOfAccount;
  standard_account?: StandardAccount;
}

export function useChartOfAccounts(clientId: string) {
  return useQuery({
    queryKey: ['chart-of-accounts', clientId],
    queryFn: async (): Promise<ChartOfAccount[]> => {
      const { data, error } = await supabase
        .from('client_chart_of_accounts')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('account_number');

      if (error) {
        toast({
          title: "Feil ved lasting av kontoplan",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      // Type cast the account_type to match our interface
      return (data || []).map(account => ({
        ...account,
        account_type: account.account_type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
      }));
    },
    enabled: !!clientId,
  });
}

export function useStandardAccounts() {
  return useQuery({
    queryKey: ['standard-accounts'],
    queryFn: async (): Promise<StandardAccount[]> => {
      const { data, error } = await supabase
        .from('standard_accounts')
        .select('*')
        .order('standard_number');

      if (error) {
        toast({
          title: "Feil ved lasting av standardkontoer",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      return (data || []).map(a => ({
        ...a,
        account_type: a.account_type as StandardAccount['account_type'],
      }));
    },
  });
}

export function useAccountMappings(clientId: string) {
  return useQuery({
    queryKey: ['account-mappings', clientId],
    queryFn: async (): Promise<AccountMapping[]> => {
      const { data, error } = await supabase
        .from('account_mappings')
        .select(`
          *,
          client_account:client_chart_of_accounts(*),
          standard_account:standard_accounts(*)
        `)
        .eq('client_id', clientId);

      if (error) {
        toast({
          title: "Feil ved lasting av kontomapping",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      // Type cast the nested account_type fields
      return (data || []).map(mapping => ({
        ...mapping,
        client_account: mapping.client_account
          ? {
              ...mapping.client_account,
              account_type: mapping.client_account.account_type as ChartOfAccount['account_type']
            }
          : undefined,
        standard_account: mapping.standard_account
          ? {
              ...mapping.standard_account,
              account_type: mapping.standard_account.account_type as StandardAccount['account_type']
            }
          : undefined
      }));
    },
    enabled: !!clientId,
  });
}

export function useCreateAccountMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: Omit<AccountMapping, 'id'>) => {
      const { data, error } = await supabase
        .from('account_mappings')
        .insert(mapping)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['account-mappings', data.client_id] });
      toast({
        title: "Kontomapping opprettet",
        description: "Kontomappingen ble opprettet",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved opprettelse av kontomapping",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

export function useUpdateAccountMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AccountMapping> & { id: string }) => {
      const { data, error } = await supabase
        .from('account_mappings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['account-mappings', data.client_id] });
      toast({
        title: "Kontomapping oppdatert",
        description: "Kontomappingen ble oppdatert",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved oppdatering av kontomapping",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

export function useCreateStandardAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<StandardAccount, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('standard_accounts')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as StandardAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-accounts'] });
      toast({
        title: 'Standardkonto opprettet',
        description: 'Standardkontoen ble opprettet',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved opprettelse av standardkonto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateStandardAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StandardAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('standard_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StandardAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-accounts'] });
      toast({
        title: 'Standardkonto oppdatert',
        description: 'Standardkontoen ble oppdatert',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved oppdatering av standardkonto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteStandardAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('standard_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-accounts'] });
      toast({
        title: 'Standardkonto slettet',
        description: 'Standardkontoen ble slettet',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved sletting av standardkonto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
