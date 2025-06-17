
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_types')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as ContentType[];
    }
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
      // Check if content type is in use
      const { data: articlesInUse } = await supabase
        .from('knowledge_articles')
        .select('id')
        .eq('content_type_id', id)
        .limit(1);
      
      if (articlesInUse && articlesInUse.length > 0) {
        throw new Error('Kan ikke slette innholdstype som er i bruk av artikler');
      }
      
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
