import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KnowledgeCategory } from '@/types/knowledge';

// Build hierarchical structure from flat array
const buildTree = (cats: KnowledgeCategory[], parentId: string | null = null): KnowledgeCategory[] => {
  return cats
    .filter(c => c.parent_category_id === parentId)
    .sort((a, b) => a.display_order - b.display_order)
    .map(c => ({ ...c, children: buildTree(cats, c.id) }));
};

export const useKnowledgeCategories = () => {
  return useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async (): Promise<KnowledgeCategory[]> => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('parent_category_id', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching knowledge categories:', error);
        throw error;
      }

      return buildTree(data || []);
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useCreateKnowledgeCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<KnowledgeCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const payload = {
        name: category.name,
        description: category.description || null,
        icon: category.icon || null,
        parent_category_id: category.parent_category_id || null,
        display_order: category.display_order,
        applicable_phases: category.applicable_phases || null,
      };

      const { data, error } = await supabase
        .from('knowledge_categories')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] });
      toast.success('Kategori opprettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved opprettelse: ' + error.message);
    },
  });
};

export const useUpdateKnowledgeCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeCategory> & { id: string }) => {
      const payload = {
        name: updates.name,
        description: updates.description || null,
        icon: updates.icon || null,
        parent_category_id: updates.parent_category_id || null,
        display_order: updates.display_order,
        applicable_phases: updates.applicable_phases || null,
      };

      const { data, error } = await supabase
        .from('knowledge_categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as KnowledgeCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] });
      toast.success('Kategori oppdatert');
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering: ' + error.message);
    },
  });
};

export const useDeleteKnowledgeCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
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
    onError: (error: any) => {
      toast.error('Feil ved sletting: ' + error.message);
    },
  });
};
