import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AccountClassification {
  id: string;
  client_id: string;
  account_number: string;
  original_category: string;
  new_category: string;
  classification_type: 'manual' | 'rule' | 'bulk';
  applied_by?: string;
  applied_at: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  version_id?: string;
}

export function useAccountClassifications(clientId: string, versionId?: string) {
  return useQuery({
    queryKey: ['account-classifications', clientId, versionId],
    queryFn: async () => {
      let query = supabase
        .from('account_classifications')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('applied_at', { ascending: false });

      if (versionId) {
        query = query.eq('version_id', versionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching account classifications:', error);
        throw error;
      }

      return data as AccountClassification[];
    },
    enabled: !!clientId,
  });
}

export function useSaveAccountClassification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (classification: Omit<AccountClassification, 'id' | 'applied_at'>) => {
      // First, deactivate any existing classification for this account
      const { error: deactivateError } = await supabase
        .from('account_classifications')
        .update({ is_active: false })
        .eq('client_id', classification.client_id)
        .eq('account_number', classification.account_number)
        .eq('version_id', classification.version_id || '')
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Error deactivating existing classification:', deactivateError);
        throw deactivateError;
      }

      // Then insert the new classification
      const { data, error } = await supabase
        .from('account_classifications')
        .insert([classification])
        .select()
        .single();

      if (error) {
        console.error('Error saving account classification:', error);
        throw error;
      }

      return data as AccountClassification;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['account-classifications', data.client_id] 
      });
      queryClient.invalidateQueries({
        queryKey: ['trial-balance-with-mappings', data.client_id],
      });
      toast({
        title: "Klassifisering lagret",
        description: `Konto ${data.account_number} er klassifisert til ${data.new_category}`,
      });
    },
    onError: (error) => {
      console.error('Error in classification mutation:', error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre kontoklassifiseringen",
        variant: "destructive",
      });
    },
  });
}

export function useBulkSaveAccountClassifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (classifications: Omit<AccountClassification, 'id' | 'applied_at'>[]) => {
      if (classifications.length === 0) return [];

      const clientId = classifications[0].client_id;
      const versionId = classifications[0].version_id;

      // First, deactivate existing classifications for these accounts
      const accountNumbers = classifications.map(c => c.account_number);
      const { error: deactivateError } = await supabase
        .from('account_classifications')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .in('account_number', accountNumbers)
        .eq('version_id', versionId || '')
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Error deactivating existing classifications:', deactivateError);
        throw deactivateError;
      }

      // Then insert the new classifications
      const { data, error } = await supabase
        .from('account_classifications')
        .insert(classifications)
        .select();

      if (error) {
        console.error('Error saving bulk account classifications:', error);
        throw error;
      }

      return data as AccountClassification[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['account-classifications', data[0].client_id] 
        });
        queryClient.invalidateQueries({
          queryKey: ['trial-balance-with-mappings', data[0].client_id],
        });
        toast({
          title: "Bulk klassifisering lagret",
          description: `${data.length} kontoer ble klassifisert`,
        });
      }
    },
    onError: (error) => {
      console.error('Error in bulk classification mutation:', error);
      toast({
        title: "Feil ved bulk lagring",
        description: "Kunne ikke lagre kontoklassifiseringene",
        variant: "destructive",
      });
    },
  });
}