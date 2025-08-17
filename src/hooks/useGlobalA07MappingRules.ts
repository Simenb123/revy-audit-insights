import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GlobalA07MappingRule {
  id: string;
  rule_name: string;
  account_range_start: number;
  account_range_end: number;
  a07_performance_code: string;
  confidence_score: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useGlobalA07MappingRules = () => {
  return useQuery({
    queryKey: ['global-a07-mapping-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_a07_mapping_rules')
        .select('*')
        .eq('is_active', true)
        .order('account_range_start');

      if (error) throw error;
      return data as GlobalA07MappingRule[];
    },
  });
};

export const useSaveGlobalA07MappingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<GlobalA07MappingRule, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('global_a07_mapping_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-a07-mapping-rules'] });
      toast.success('A07 mappingregel lagret');
    },
    onError: (error) => {
      toast.error(`Feil ved lagring av A07 mappingregel: ${error.message}`);
    },
  });
};

export const useUpdateGlobalA07MappingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GlobalA07MappingRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('global_a07_mapping_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-a07-mapping-rules'] });
      toast.success('A07 mappingregel oppdatert');
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering av A07 mappingregel: ${error.message}`);
    },
  });
};

export const useDeleteGlobalA07MappingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('global_a07_mapping_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-a07-mapping-rules'] });
      toast.success('A07 mappingregel slettet');
    },
    onError: (error) => {
      toast.error(`Feil ved sletting av A07 mappingregel: ${error.message}`);
    },
  });
};

export const useApplyGlobalA07AutoMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      // This would be implemented to apply global rules to client mappings
      const { data: rules } = await supabase
        .from('global_a07_mapping_rules')
        .select('*')
        .eq('is_active', true);

      if (!rules) return { applied: 0 };

      // Get client's chart of accounts
      const { data: accounts } = await supabase
        .from('client_chart_of_accounts')
        .select('account_number')
        .eq('client_id', clientId);

      if (!accounts) return { applied: 0 };

      let appliedCount = 0;

      for (const account of accounts) {
        const accountNumber = parseInt(account.account_number);
        const matchingRule = rules.find(rule => 
          accountNumber >= rule.account_range_start && 
          accountNumber <= rule.account_range_end
        );

        if (matchingRule) {
          // Upsert A07 mapping for this account
          await supabase
            .from('a07_account_mappings')
            .upsert({
              client_id: clientId,
              account_number: account.account_number,
              a07_performance_code: matchingRule.a07_performance_code,
              mapping_description: `Auto-mapppet: ${matchingRule.rule_name}`
            }, {
              onConflict: 'client_id,account_number'
            });
          appliedCount++;
        }
      }

      return { applied: appliedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['a07-account-mappings'] });
      toast.success(`${result.applied} A07 mappinger ble automatisk anvendt`);
    },
    onError: (error) => {
      toast.error(`Feil ved automatisk A07 mapping: ${error.message}`);
    },
  });
};