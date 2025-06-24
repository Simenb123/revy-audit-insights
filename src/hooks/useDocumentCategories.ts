
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/devLogger';

export interface DocumentCategory {
  id: string;
  subject_area: string;
  category_name: string;
  description?: string;
  expected_file_patterns?: string[];
  is_standard?: boolean;
  created_at: string;
}

export const useDocumentCategories = () => {
  return useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('subject_area', { ascending: true });

      if (error) {
        devLog('Error fetching document categories:', error);
        throw error;
      }

      return data || [];
    },
  });
};
