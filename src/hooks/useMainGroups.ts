import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MAIN_GROUPS_KEY = ['main-groups'];

export interface MainGroup {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_system_group?: boolean;
  created_at: string;
  updated_at: string;
}

export const useMainGroups = () => {
  return useQuery({
    queryKey: MAIN_GROUPS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('main_groups')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateMainGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (group: Omit<MainGroup, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('main_groups')
        .insert([group])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAIN_GROUPS_KEY });
    },
  });
};

export const useUpdateMainGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MainGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('main_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAIN_GROUPS_KEY });
    },
  });
};

export const useDeleteMainGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('main_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAIN_GROUPS_KEY });
    },
  });
};