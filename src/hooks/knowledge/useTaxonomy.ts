
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

function createTaxonomyHooks<
  T extends Record<string, any>,
  TableName extends keyof Database['public']['Tables']
>(table: TableName, displayName: string) {
  const useTaxonomies = () => {
    return useQuery({
      queryKey: [table],
      queryFn: async (): Promise<T[]> => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('sort_order, name');
        if (error) throw error;
        return (data as any[]) || [];
      }
    });
  };

  const useTaxonomyById = (id?: string) => {
    return useQuery({
      queryKey: [table, id],
      queryFn: async (): Promise<T | null> => {
        if (!id) return null;
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data as T;
      },
      enabled: !!id
    });
  };

  const useCreateTaxonomy = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data: any) => {
        const { data: result, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return result as T;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [table] });
        toast.success(`${displayName} opprettet`);
      },
      onError: (err: any) => {
        toast.error(`Feil ved opprettelse: ${err.message}`);
      }
    });
  };

  const useUpdateTaxonomy = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...updates }: any) => {
        const { data: result, error } = await supabase
          .from(table)
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return result as T;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [table] });
        toast.success(`${displayName} oppdatert`);
      },
      onError: (err: any) => {
        toast.error(`Feil ved oppdatering: ${err.message}`);
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
        toast.success(`${displayName} slettet`);
      },
      onError: (err: any) => {
        toast.error(`Feil ved sletting: ${err.message}`);
      }
    });
  };

  return {
    useTaxonomies,
    useTaxonomyById,
    useCreateTaxonomy,
    useUpdateTaxonomy,
    useDeleteTaxonomy
  };
}

export default createTaxonomyHooks;
