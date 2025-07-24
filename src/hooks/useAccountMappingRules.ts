import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccountMappingRule {
  id: string;
  rule_name: string;
  account_range_start: number;
  account_range_end: number;
  standard_account_id: string;
  confidence_score: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AccountMappingSuggestion {
  id: string;
  client_id: string;
  client_account_id: string;
  suggested_standard_account_id: string;
  rule_id: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export const useAccountMappingRules = () => {
  return useQuery({
    queryKey: ['account-mapping-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_mapping_rules')
        .select('*')
        .eq('is_active', true)
        .order('account_range_start', { ascending: true });

      if (error) throw error;
      return data as AccountMappingRule[];
    },
  });
};

export const useCreateAccountMappingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<AccountMappingRule, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('account_mapping_rules')
        .insert([rule])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-mapping-rules'] });
      toast.success('Mappingregel opprettet');
    },
    onError: (error) => {
      toast.error(`Feil ved opprettelse av mappingregel: ${error.message}`);
    },
  });
};

export const useUpdateAccountMappingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AccountMappingRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('account_mapping_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-mapping-rules'] });
      toast.success('Mappingregel oppdatert');
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering av mappingregel: ${error.message}`);
    },
  });
};

export const useDeleteAccountMappingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('account_mapping_rules')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-mapping-rules'] });
      toast.success('Mappingregel deaktivert');
    },
    onError: (error) => {
      toast.error(`Feil ved deaktivering av mappingregel: ${error.message}`);
    },
  });
};

export const useAccountMappingSuggestions = (clientId: string) => {
  return useQuery({
    queryKey: ['account-mapping-suggestions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_mapping_suggestions')
        .select(`
          *,
          client_chart_of_accounts!client_account_id(account_number, account_name),
          standard_accounts!suggested_standard_account_id(account_number, account_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};

export const useGenerateAccountMappingSuggestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      // First, get the client's unmapped accounts
      const { data: clientAccounts, error: accountsError } = await supabase
        .from('client_chart_of_accounts')
        .select('*')
        .eq('client_id', clientId)
        .not('id', 'in', `(
          SELECT client_account_id 
          FROM account_mappings 
          WHERE client_id = '${clientId}'
        )`);

      if (accountsError) throw accountsError;

      // Get mapping rules
      const { data: rules, error: rulesError } = await supabase
        .from('account_mapping_rules')
        .select('*')
        .eq('is_active', true)
        .order('account_range_start', { ascending: true });

      if (rulesError) throw rulesError;

      // Generate suggestions based on account numbers
      const suggestions = [];
      for (const account of clientAccounts || []) {
        const accountNumber = parseInt(account.account_number);
        
        // Find matching rule
        const matchingRule = rules?.find(rule => 
          accountNumber >= rule.account_range_start && 
          accountNumber <= rule.account_range_end
        );

        if (matchingRule) {
          suggestions.push({
            client_id: clientId,
            client_account_id: account.id,
            suggested_standard_account_id: matchingRule.standard_account_id,
            rule_id: matchingRule.id,
            confidence_score: matchingRule.confidence_score,
            status: 'pending' as const
          });
        }
      }

      // Insert suggestions
      if (suggestions.length > 0) {
        const { data, error } = await supabase
          .from('account_mapping_suggestions')
          .insert(suggestions)
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: (data, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['account-mapping-suggestions', clientId] });
      toast.success(`Genererte ${data.length} forslag til kontomapping`);
    },
    onError: (error) => {
      toast.error(`Feil ved generering av forslag: ${error.message}`);
    },
  });
};

export const useApproveMappingSuggestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ suggestionIds, clientId }: { suggestionIds: string[]; clientId: string }) => {
      // Update suggestions to approved
      const { data: approvedSuggestions, error: updateError } = await supabase
        .from('account_mapping_suggestions')
        .update({ status: 'approved' })
        .in('id', suggestionIds)
        .select();

      if (updateError) throw updateError;

      // Create actual mappings
      const mappings = approvedSuggestions.map(suggestion => ({
        client_id: clientId,
        client_account_id: suggestion.client_account_id,
        standard_account_id: suggestion.suggested_standard_account_id,
        mapping_confidence: suggestion.confidence_score,
        is_manual_mapping: false
      }));

      const { error: mappingError } = await supabase
        .from('account_mappings')
        .insert(mappings);

      if (mappingError) throw mappingError;

      return approvedSuggestions;
    },
    onSuccess: (data, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['account-mapping-suggestions', clientId] });
      queryClient.invalidateQueries({ queryKey: ['account-mappings', clientId] });
      toast.success(`Godkjente ${data.length} mappingforslag`);
    },
    onError: (error) => {
      toast.error(`Feil ved godkjenning av forslag: ${error.message}`);
    },
  });
};