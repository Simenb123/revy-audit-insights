import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FirmStandardAccount {
  id: string;
  standard_number: string;
  standard_name: string;
  account_type: string;
  category?: string;
  analysis_group?: string;
  display_order?: number;
  line_type: string;
  parent_line_id?: string;
  calculation_formula?: any;
  is_total_line: boolean;
  sign_multiplier: number;
  is_active: boolean;
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useFirmStandardAccounts() {
  return useQuery({
    queryKey: ['firm-standard-accounts'],
    queryFn: async () => {
      const response = await (supabase as any)
        .from('standard_accounts')
        .select('*')
        .order('display_order', { ascending: true })
        .order('standard_number', { ascending: true });
      
      const { data, error } = response;

      if (error) throw error;
      
      // Transform to our interface
      return (data || []).map((account: any): FirmStandardAccount => ({
        id: account.id,
        standard_number: account.standard_number,
        standard_name: account.standard_name,
        account_type: account.account_type,
        category: account.category,
        analysis_group: account.analysis_group,
        display_order: account.display_order,
        line_type: account.line_type,
        parent_line_id: account.parent_line_id,
        calculation_formula: account.calculation_formula,
        is_total_line: account.is_total_line,
        sign_multiplier: account.sign_multiplier,
        is_active: account.is_active,
        is_custom: false,
        created_at: account.created_at,
        updated_at: account.updated_at,
      }));
    },
    staleTime: 30 * 60 * 1000, // 30 min - these change rarely
    gcTime: 60 * 60 * 1000, // 60 min cache retention
    refetchOnWindowFocus: false,
  });
}

export function useCreateFirmStandardAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (account: any) => {
      throw new Error('Standard accounts are read-only');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-standard-accounts'] });
      toast.success('Standardkonto opprettet');
    },
    onError: (error) => {
      console.error('Error creating standard account:', error);
      toast.error('Feil ved opprettelse av standardkonto');
    },
  });
}

export function useUpdateFirmStandardAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      throw new Error('Standard accounts are read-only');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-standard-accounts'] });
      toast.success('Standardkonto oppdatert');
    },
    onError: (error) => {
      console.error('Error updating standard account:', error);
      toast.error('Feil ved oppdatering av standardkonto');
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