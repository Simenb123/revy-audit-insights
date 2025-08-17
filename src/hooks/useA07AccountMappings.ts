import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface A07AccountMapping {
  id: string;
  client_id: string;
  account_number: string;
  a07_performance_code: string;
  mapping_description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function useA07AccountMappings(clientId: string) {
  return useQuery({
    queryKey: ['a07-account-mappings', clientId],
    queryFn: async (): Promise<A07AccountMapping[]> => {
      const { data, error } = await supabase
        .from('a07_account_mappings')
        .select('*')
        .eq('client_id', clientId)
        .order('account_number');

      if (error) {
        console.error('Error fetching A07 account mappings:', error);
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

export function useSaveA07AccountMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      accountNumber, 
      a07PerformanceCode,
      mappingDescription 
    }: { 
      clientId: string; 
      accountNumber: string; 
      a07PerformanceCode: string;
      mappingDescription?: string;
    }) => {
      const { data, error } = await supabase
        .from('a07_account_mappings')
        .upsert({
          client_id: clientId,
          account_number: accountNumber,
          a07_performance_code: a07PerformanceCode,
          mapping_description: mappingDescription,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'client_id,account_number,a07_performance_code'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['a07-account-mappings', variables.clientId] });
      toast({
        title: "A07 mapping lagret",
        description: `Konto ${data.account_number} mapped til A07 kode ${data.a07_performance_code}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved lagring av A07 mapping",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

export function useDeleteA07AccountMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mappingId: string) => {
      const { error } = await supabase
        .from('a07_account_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all A07 mappings queries since we don't have client context
      queryClient.invalidateQueries({ queryKey: ['a07-account-mappings'] });
      toast({
        title: "A07 mapping slettet",
        description: "Mappingen ble slettet",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved sletting av A07 mapping",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}