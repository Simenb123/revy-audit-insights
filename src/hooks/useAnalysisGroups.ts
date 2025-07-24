import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalysisGroup {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_system_group?: boolean;
  created_at: string;
  updated_at: string;
}

export const useAnalysisGroups = () => {
  return useQuery({
    queryKey: ['analysis-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_groups')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateAnalysisGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (group: Omit<AnalysisGroup, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('analysis_groups')
        .insert([group])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-groups'] });
    },
  });
};

export const useUpdateAnalysisGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AnalysisGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('analysis_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-groups'] });
    },
  });
};

export const useDeleteAnalysisGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('analysis_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-groups'] });
    },
  });
};