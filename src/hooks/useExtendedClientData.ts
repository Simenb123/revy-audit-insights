import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  ClientCustomField, 
  ClientCustomFieldValue, 
  ClientShareholder
} from '@/types/client-extended';

// Export simplified client list for use in other components
export { useSimpleClientList as useExtendedClientList } from './useSimpleClientData';

// Hook for loading custom fields for a firm
export const useClientCustomFields = () => {
  return useQuery({
    queryKey: ['client-custom-fields'],
    queryFn: async (): Promise<ClientCustomField[]> => {
      const { data, error } = await supabase
        .from('client_custom_fields')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as ClientCustomField[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for managing client custom field values
export const useClientCustomFieldValues = (clientId: string) => {
  return useQuery({
    queryKey: ['client-custom-field-values', clientId],
    queryFn: async (): Promise<ClientCustomFieldValue[]> => {
      const { data, error } = await supabase
        .from('client_custom_field_values')
        .select(`
          id,
          client_id,
          custom_field_id,
          field_value,
          created_at,
          updated_at
        `)
        .eq('client_id', clientId);

      if (error) throw error;
      return data as ClientCustomFieldValue[];
    },
    enabled: !!clientId,
  });
};

// Hook for managing client shareholders
export const useClientShareholders = (clientId: string) => {
  return useQuery({
    queryKey: ['client-shareholders', clientId],
    queryFn: async (): Promise<ClientShareholder[]> => {
      const { data, error } = await supabase
        .from('client_shareholders')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('ownership_percentage', { ascending: false });

      if (error) throw error;
      return data as ClientShareholder[];
    },
    enabled: !!clientId,
  });
};

// Basic client data for database operations
interface BasicClientData {
  name: string;
  company_name: string;
  org_number: string;
  engagement_type?: 'revisjon' | 'regnskap' | 'annet';
  industry?: string;
  contact_person?: string;
  chair?: string;
  ceo?: string;
  user_id?: string;
}

// Simplified create client mutation using basic types
export const useCreateExtendedClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientData: any) => {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (clientError) throw clientError;
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extended-clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Klient opprettet",
        description: "Klienten ble opprettet successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved opprettelse",
        description: `Kunne ikke opprette klient: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Simplified update client mutation
export const useUpdateExtendedClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      clientData 
    }: { 
      clientId: string; 
      clientData: any
    }) => {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)
        .select()
        .single();

      if (clientError) throw clientError;
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extended-clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-custom-field-values'] });
      toast({
        title: "Klient oppdatert",
        description: "Klientinformasjonen ble oppdatert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved oppdatering",
        description: `Kunne ikke oppdatere klient: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Hook for managing custom field values separately
export const useUpdateCustomFieldValues = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      customFieldValues 
    }: { 
      clientId: string; 
      customFieldValues: Record<string, string> 
    }) => {
      // Delete existing custom field values for this client
      const { error: deleteError } = await supabase
        .from('client_custom_field_values')
        .delete()
        .eq('client_id', clientId);

      if (deleteError) throw deleteError;

      // Insert new custom field values
      if (Object.keys(customFieldValues).length > 0) {
        const customFieldEntries = Object.entries(customFieldValues)
          .filter(([, value]) => value !== null && value !== undefined && value !== '')
          .map(([fieldId, value]) => ({
            client_id: clientId,
            custom_field_id: fieldId,
            field_value: value
          }));

        if (customFieldEntries.length > 0) {
          const { error: customFieldError } = await supabase
            .from('client_custom_field_values')
            .insert(customFieldEntries);

          if (customFieldError) throw customFieldError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-custom-field-values'] });
      toast({
        title: "Tilleggsfelt oppdatert",
        description: "Tilleggsfeltverdiene ble oppdatert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved oppdatering",
        description: `Kunne ikke oppdatere tilleggsfelt: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};