import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccountCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_system_category?: boolean;
  created_at: string;
  updated_at: string;
}

export const useAccountCategories = () => {
  return useQuery({
    queryKey: ['account-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useCreateAccountCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Omit<AccountCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('account_categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateAccountCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AccountCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('account_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteAccountCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('account_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};