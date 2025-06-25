import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaxonomyBase {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export const createTaxonomyHooks = <T extends TaxonomyBase>(table: string, typeName: string) => {
  const useTaxonomies = () => {
    return useQuery({
      queryKey: [table],
      queryFn: async (): Promise<T[]> => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          throw error;
        }

        return (data || []) as T[];
      },
      staleTime: 1000 * 60 * 10,
    });
  };

  const useTaxonomyById = (id: string) => {
    return useQuery({
      queryKey: [table, id],
      queryFn: async (): Promise<T | null> => {
        if (!id) return null;

        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error(`Error fetching ${typeName.toLowerCase()}:`, error);
          throw error;
        }

        return data as T;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 10,
    });
  };

  const useCreateTaxonomy = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
        const { data, error } = await supabase
          .from(table)
          .insert(item)
          .select()
          .single();

        if (error) throw error;
        return data as T;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [table] });
        toast.success(`${typeName} opprettet`);
      },
      onError: (error: any) => {
        toast.error(`Feil ved opprettelse: ${error.message}`);
      }
    });
  };

  const useUpdateTaxonomy = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<T> & { id: string }) => {
        const { data, error } = await supabase
          .from(table)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as T;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [table] });
        toast.success(`${typeName} oppdatert`);
      },
      onError: (error: any) => {
        toast.error(`Feil ved oppdatering: ${error.message}`);
      }
    });
  };

  const useDeleteTaxonomy = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [table] });
        toast.success(`${typeName} slettet`);
      },
      onError: (error: any) => {
        toast.error(`Feil ved sletting: ${error.message}`);
      }
    });
  };

  return {
    useTaxonomies,
    useTaxonomyById,
    useCreateTaxonomy,
    useUpdateTaxonomy,
    useDeleteTaxonomy,
  };
};

export default createTaxonomyHooks;
