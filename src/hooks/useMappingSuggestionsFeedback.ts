import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MappingSuggestionFeedback {
  id?: string;
  client_id: string;
  client_account_id: string;
  suggested_standard_account_id: string;
  confidence_score: number;
  rule_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
}

export const useMappingSuggestionsFeedback = (clientId: string) => {
  return useQuery({
    queryKey: ['mapping-suggestions-feedback', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_mapping_suggestions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useSaveMappingSuggestionFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestion: MappingSuggestionFeedback) => {
      const { data, error } = await supabase
        .from('account_mapping_suggestions')
        .insert(suggestion)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping-suggestions-feedback'] });
    },
    onError: (error) => {
      console.error('Error saving mapping suggestion feedback:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre tilbakemelding på mapping-forslag",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateMappingSuggestionFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, approved_by }: { id: string; status: string; approved_by?: string }) => {
      const { data, error } = await supabase
        .from('account_mapping_suggestions')
        .update({ status, approved_by })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapping-suggestions-feedback'] });
      toast({
        title: "Lagret!",
        description: "Tilbakemelding på mapping-forslag oppdatert",
      });
    },
    onError: (error) => {
      console.error('Error updating mapping suggestion feedback:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere tilbakemelding",
        variant: "destructive"
      });
    }
  });
};