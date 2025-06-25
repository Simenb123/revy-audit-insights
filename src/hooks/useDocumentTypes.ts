
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentType } from '@/types/classification';

export interface DocumentTag {
  id: string;
  name: string;
  display_name: string;
  color: string;
  description?: string;
  is_system_tag: boolean;
  usage_count: number;
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as DocumentType[];
    }
  });
}

export function useDocumentTags() {
  return useQuery({
    queryKey: ['document-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_tags')
        .select('*')
        .order('usage_count', { ascending: false });
      
    if (error) throw error;
    return data as DocumentTag[];
  }
  });
}

export type { DocumentType };
