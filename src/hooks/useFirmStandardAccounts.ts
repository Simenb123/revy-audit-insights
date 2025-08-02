import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FirmStandardAccountRow = Database['public']['Tables']['firm_standard_accounts']['Row'];
type FirmStandardAccountInsert = Database['public']['Tables']['firm_standard_accounts']['Insert'];
type FirmStandardAccountUpdate = Database['public']['Tables']['firm_standard_accounts']['Update'];

export interface FirmStandardAccount extends FirmStandardAccountRow {}

export function useFirmStandardAccounts() {
  return useQuery({
    queryKey: ['firm-standard-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('firm_standard_accounts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('standard_number', { ascending: true });

      if (error) throw error;
      return data as FirmStandardAccount[];
    },
  });
}

export function useCreateFirmStandardAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (account: FirmStandardAccountInsert) => {
      const { data, error } = await supabase
        .from('firm_standard_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-standard-accounts'] });
      toast.success('Firmaspesifikk standardkonto opprettet');
    },
    onError: (error) => {
      console.error('Error creating firm standard account:', error);
      toast.error('Feil ved opprettelse av firmaspesifikk standardkonto');
    },
  });
}

export function useUpdateFirmStandardAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: FirmStandardAccountUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('firm_standard_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-standard-accounts'] });
      toast.success('Firmaspesifikk standardkonto oppdatert');
    },
    onError: (error) => {
      console.error('Error updating firm standard account:', error);
      toast.error('Feil ved oppdatering av firmaspesifikk standardkonto');
    },
  });
}

export function useCopyGlobalStandards() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (firmId: string) => {
      const { data, error } = await supabase.rpc('copy_global_standards_to_firm', {
        p_audit_firm_id: firmId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (copiedCount) => {
      queryClient.invalidateQueries({ queryKey: ['firm-standard-accounts'] });
      toast.success(`${copiedCount} standardkontoer kopiert til firma`);
    },
    onError: (error) => {
      console.error('Error copying global standards:', error);
      toast.error('Feil ved kopiering av globale standarder');
    },
  });
}

export function useCopyGlobalMappingRules() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (firmId: string) => {
      const { data, error } = await supabase.rpc('copy_global_mapping_rules_to_firm', {
        p_audit_firm_id: firmId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (copiedCount) => {
      queryClient.invalidateQueries({ queryKey: ['firm-mapping-rules'] });
      toast.success(`${copiedCount} mapping-regler kopiert til firma`);
    },
    onError: (error) => {
      console.error('Error copying global mapping rules:', error);
      toast.error('Feil ved kopiering av globale mapping-regler');
    },
  });
}