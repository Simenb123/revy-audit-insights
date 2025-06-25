import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import TaxonomyTable from './TaxonomyTable';
import { TaxonomyData } from './TaxonomyForm';

const CategoryManager = () => {
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['knowledge-categories-simple'],
    queryFn: async (): Promise<KnowledgeCategory[]> => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as KnowledgeCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaxonomyData) => {
      const payload = {
        name: data.name,
        description: data.description,
        icon: data.icon,
        display_order: data.sort_order ?? 0,
      };
      const { error } = await supabase.from('knowledge_categories').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-categories-simple'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaxonomyData }) => {
      const updates = {
        name: data.name,
        description: data.description,
        icon: data.icon,
        display_order: data.sort_order ?? 0,
      };
      const { error } = await supabase
        .from('knowledge_categories')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-categories-simple'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-categories-simple'] }),
  });

  const items = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    display_name: cat.name,
    description: cat.description,
    icon: cat.icon,
    color: undefined,
    sort_order: cat.display_order,
    is_active: true,
  }));

  return (
    <TaxonomyTable
      title="Kategorier"
      items={items}
      onCreate={(data) => createMutation.mutate(data)}
      onUpdate={(id, data) => updateMutation.mutate({ id, data })}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  );
};

export default CategoryManager;
