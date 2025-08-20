import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MappingRule {
  id: string;
  client_id: string;
  account: string;
  code: string;
  strategy: 'exclusive' | 'split' | 'score';
  split?: number;
  weight: number;
  keywords: string[];
  regex: string;
  priority: number;
  month_hints: number[];
  inserted_at: string;
  updated_at: string;
}

export type CreateMappingRule = Omit<MappingRule, 'id' | 'inserted_at' | 'updated_at'>;
export type UpdateMappingRule = Partial<CreateMappingRule> & { id: string };

/**
 * Hook to fetch mapping rules for a client
 */
export function useMappingRules(clientId: string) {
  return useQuery({
    queryKey: ['mapping-rules', clientId],
    queryFn: async (): Promise<MappingRule[]> => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('mapping_rules')
        .select('*')
        .eq('client_id', clientId)
        .order('priority', { ascending: false })
        .order('account');
      
      if (error) throw error;
      return (data || []) as MappingRule[];
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create a new mapping rule
 */
export function useCreateMappingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rule: CreateMappingRule): Promise<MappingRule> => {
      const { data, error } = await supabase
        .from('mapping_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data as MappingRule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mapping-rules', data.client_id] });
      toast({
        title: 'Regel opprettet',
        description: `Mapping regel for konto ${data.account} er opprettet.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil ved oppretting',
        description: 'Kunne ikke opprette mapping regel.',
        variant: 'destructive',
      });
      console.error('Error creating mapping rule:', error);
    },
  });
}

/**
 * Hook to update an existing mapping rule
 */
export function useUpdateMappingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateMappingRule): Promise<MappingRule> => {
      const { data, error } = await supabase
        .from('mapping_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as MappingRule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mapping-rules', data.client_id] });
      toast({
        title: 'Regel oppdatert',
        description: `Mapping regel for konto ${data.account} er oppdatert.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil ved oppdatering',
        description: 'Kunne ikke oppdatere mapping regel.',
        variant: 'destructive',
      });
      console.error('Error updating mapping rule:', error);
    },
  });
}

/**
 * Hook to delete a mapping rule
 */
export function useDeleteMappingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }): Promise<void> => {
      const { error } = await supabase
        .from('mapping_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mapping-rules', variables.clientId] });
      toast({
        title: 'Regel slettet',
        description: 'Mapping regel er slettet.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil ved sletting',
        description: 'Kunne ikke slette mapping regel.',
        variant: 'destructive',
      });
      console.error('Error deleting mapping rule:', error);
    },
  });
}

/**
 * Hook to bulk create mapping rules (useful for accepting exact matches)
 */
export function useBulkCreateMappingRules() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rules: CreateMappingRule[]): Promise<MappingRule[]> => {
      if (rules.length === 0) return [];
      
      const { data, error } = await supabase
        .from('mapping_rules')
        .insert(rules)
        .select();
      
      if (error) throw error;
      return (data || []) as MappingRule[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['mapping-rules', data[0].client_id] });
        toast({
          title: 'Regler opprettet',
          description: `${data.length} mapping regler er opprettet.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Feil ved bulk oppretting',
        description: 'Kunne ikke opprette mapping regler.',
        variant: 'destructive',
      });
      console.error('Error bulk creating mapping rules:', error);
    },
  });
}