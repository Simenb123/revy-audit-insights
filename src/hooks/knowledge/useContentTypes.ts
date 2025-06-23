
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContentType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useContentTypes = () => {
  return useQuery({
    queryKey: ['content-types'],
    queryFn: async (): Promise<ContentType[]> => {
      const { data, error } = await supabase
        .from('content_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching content types:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useContentTypeById = (id: string) => {
  return useQuery({
    queryKey: ['content-type', id],
    queryFn: async (): Promise<ContentType | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('content_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching content type:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateContentType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contentType: Omit<ContentType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('content_types')
        .insert(contentType)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      toast.success('Innholdstype opprettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved opprettelse: ' + error.message);
    }
  });
};

export const useUpdateContentType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentType> & { id: string }) => {
      const { data, error } = await supabase
        .from('content_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      toast.success('Innholdstype oppdatert');
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering: ' + error.message);
    }
  });
};

export const useDeleteContentType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('content_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      toast.success('Innholdstype slettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved sletting: ' + error.message);
    }
  });
};
