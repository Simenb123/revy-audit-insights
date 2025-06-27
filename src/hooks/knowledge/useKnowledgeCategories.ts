
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuditPhase } from '@/types/revio';

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_category_id?: string;
  display_order: number;
  applicable_phases?: AuditPhase[];
  created_at: string;
  updated_at: string;
  children?: KnowledgeCategory[];
}

export const useKnowledgeCategories = () => {
  return useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as KnowledgeCategory[];
    },
  });
};

export const useCreateKnowledgeCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryData: Omit<KnowledgeCategory, 'id' | 'created_at' | 'updated_at' | 'slug'>) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('knowledge_categories')
        .insert({
          ...categoryData,
          slug: categoryData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
          applicable_phases: categoryData.applicable_phases as any
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] });
      toast.success('Kategori opprettet');
    },
    onError: (error) => {
      toast.error('Feil ved opprettelse av kategori: ' + error.message);
    },
  });
};

export const useUpdateKnowledgeCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<KnowledgeCategory> & { id: string }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('knowledge_categories')
        .update({
          ...updateData,
          ...(updateData.name
            ? {
                slug: updateData.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '')
              }
            : {}),
          applicable_phases: updateData.applicable_phases as any
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] });
      toast.success('Kategori oppdatert');
    },
    onError: (error) => {
      toast.error('Feil ved oppdatering av kategori: ' + error.message);
    },
  });
};

export const useDeleteKnowledgeCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] });
      toast.success('Kategori slettet');
    },
    onError: (error) => {
      toast.error('Feil ved sletting av kategori: ' + error.message);
    },
  });
};
