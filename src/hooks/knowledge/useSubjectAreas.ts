import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import createTaxonomyHooks from './useTaxonomy';

export interface SubjectArea {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  parent_subject_area_id?: string;
  created_at: string;
  updated_at: string;
}

// Use the generic taxonomy hooks
const {
  useTaxonomies: useSubjectAreas,
  useTaxonomyById: useSubjectAreaById,
  useCreateTaxonomy: useCreateSubjectArea,
  useUpdateTaxonomy: useUpdateSubjectArea,
  useDeleteTaxonomy: useDeleteSubjectArea,
} = createTaxonomyHooks<SubjectArea, 'subject_areas'>('subject_areas', 'Emneområde');

export {
  useSubjectAreas,
  useSubjectAreaById,
  useCreateSubjectArea,
  useUpdateSubjectArea,
  useDeleteSubjectArea,
};

// Keep existing custom hooks
export const useSubjectAreaConnections = (subjectAreaId?: string) => {
  return useQuery({
    queryKey: ['subject-area-connections', subjectAreaId],
    queryFn: async () => {
      if (!subjectAreaId) return [];
      
      const { data, error } = await supabase
        .from('article_subject_areas')
        .select(`
          *,
          knowledge_articles (
            id,
            title,
            status
          )
        `)
        .eq('subject_area_id', subjectAreaId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!subjectAreaId
  });
};

export const useDocumentTypeSubjectAreas = (documentTypeId?: string) => {
  return useQuery({
    queryKey: ['document-type-subject-areas', documentTypeId],
    queryFn: async () => {
      if (!documentTypeId) return [];
      
      const { data, error } = await supabase
        .from('document_type_subject_areas')
        .select(`
          *,
          subject_areas (
            id,
            name,
            display_name,
            color
          )
        `)
        .eq('document_type_id', documentTypeId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!documentTypeId
  });
};

export const useConnectDocumentTypeSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentTypeId, subjectAreaId }: { 
      documentTypeId: string; 
      subjectAreaId: string; 
    }) => {
      const { data, error } = await supabase
        .from('document_type_subject_areas')
        .insert({
          document_type_id: documentTypeId,
          subject_area_id: subjectAreaId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-type-subject-areas'] });
      toast.success('Kobling opprettet');
    },
    onError: (error: any) => {
      toast.error(`Feil ved kobling: ${error.message}`);
    }
  });
};

export const useDisconnectDocumentTypeSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('document_type_subject_areas')
        .delete()
        .eq('id', connectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-type-subject-areas'] });
      toast.success('Kobling fjernet');
    },
    onError: (error: any) => {
      toast.error(`Feil ved fjerning: ${error.message}`);
    }
  });
};
