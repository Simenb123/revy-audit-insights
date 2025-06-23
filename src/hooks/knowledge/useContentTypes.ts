
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
