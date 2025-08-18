import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  ExtendedClient, 
  ClientCustomField, 
  ClientCustomFieldValue, 
  ClientShareholder,
  ClientSearchParams,
  ClientSearchResult,
  ClientFormData 
} from '@/types/client-extended';

// Hook for loading clients with advanced search and filtering
export const useExtendedClientList = (params: ClientSearchParams = {}) => {
  return useQuery({
    queryKey: ['extended-clients', params],
    queryFn: async (): Promise<ClientSearchResult> => {
      let query = supabase
        .from('clients')
        .select(`
          *,
          ${params.include_custom_fields ? `
          client_custom_field_values:client_custom_field_values (
            id,
            field_value,
            custom_field:client_custom_fields (
              id,
              field_name,
              field_label,
              field_type,
              field_options
            )
          ),
          ` : ''}
          ${params.include_shareholders ? `
          shareholders:client_shareholders (*)
          ` : ''}
        `);

      // Apply search
      if (params.search) {
        query = query.or(`company_name.ilike.%${params.search}%,org_number.ilike.%${params.search}%,name.ilike.%${params.search}%`);
      }

      // Apply filters
      if (params.filters && params.filters.length > 0) {
        params.filters.forEach(filter => {
          switch (filter.operator) {
            case 'equals':
              query = query.eq(filter.field, filter.value);
              break;
            case 'contains':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case 'starts_with':
              query = query.ilike(filter.field, `${filter.value}%`);
              break;
            case 'ends_with':
              query = query.ilike(filter.field, `%${filter.value}`);
              break;
            case 'gt':
              query = query.gt(filter.field, filter.value);
              break;
            case 'gte':
              query = query.gte(filter.field, filter.value);
              break;
            case 'lt':
              query = query.lt(filter.field, filter.value);
              break;
            case 'lte':
              query = query.lte(filter.field, filter.value);
              break;
            case 'in':
              query = query.in(filter.field, filter.value);
              break;
            case 'not_in':
              query = query.not(filter.field, 'in', `(${filter.value.join(',')})`);
              break;
            case 'is_null':
              query = query.is(filter.field, null);
              break;
            case 'is_not_null':
              query = query.not(filter.field, 'is', null);
              break;
          }
        });
      }

      // Apply sorting
      if (params.sort_by) {
        query = query.order(params.sort_by, { 
          ascending: params.sort_direction === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 50;
      const offset = (page - 1) * limit;
      
      const countQuery = supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Apply same filters to count query
      if (params.search) {
        countQuery.or(`company_name.ilike.%${params.search}%,org_number.ilike.%${params.search}%,name.ilike.%${params.search}%`);
      }

      if (params.filters && params.filters.length > 0) {
        params.filters.forEach(filter => {
          switch (filter.operator) {
            case 'equals':
              countQuery.eq(filter.field, filter.value);
              break;
            case 'contains':
              countQuery.ilike(filter.field, `%${filter.value}%`);
              break;
            // Add other operators as needed
          }
        });
      }

      const [{ data, error }, { count }] = await Promise.all([
        query.range(offset, offset + limit - 1),
        countQuery
      ]);

      if (error) throw error;

      return {
        clients: data as ExtendedClient[],
        total_count: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + (data?.length || 0)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

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
          *,
          custom_field:client_custom_fields (*)
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

// Mutation for creating/updating clients with custom fields
export const useCreateExtendedClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientData: ClientFormData): Promise<ExtendedClient> => {
      const { custom_field_values, ...baseClientData } = clientData;

      // Create the client first
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert(baseClientData)
        .select()
        .single();

      if (clientError) throw clientError;

      // If there are custom field values, save them
      if (custom_field_values && Object.keys(custom_field_values).length > 0) {
        const customFieldEntries = Object.entries(custom_field_values).map(([fieldId, value]) => ({
          client_id: client.id,
          custom_field_id: fieldId,
          field_value: value
        }));

        const { error: customFieldError } = await supabase
          .from('client_custom_field_values')
          .insert(customFieldEntries);

        if (customFieldError) throw customFieldError;
      }

      return client as ExtendedClient;
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

// Mutation for updating clients with custom fields
export const useUpdateExtendedClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      clientData 
    }: { 
      clientId: string; 
      clientData: Partial<ClientFormData> 
    }): Promise<ExtendedClient> => {
      const { custom_field_values, ...baseClientData } = clientData;

      // Update the client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .update(baseClientData)
        .eq('id', clientId)
        .select()
        .single();

      if (clientError) throw clientError;

      // Update custom field values if provided
      if (custom_field_values) {
        // Delete existing custom field values for this client
        const { error: deleteError } = await supabase
          .from('client_custom_field_values')
          .delete()
          .eq('client_id', clientId);

        if (deleteError) throw deleteError;

        // Insert new custom field values
        if (Object.keys(custom_field_values).length > 0) {
          const customFieldEntries = Object.entries(custom_field_values)
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
      }

      return client as ExtendedClient;
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