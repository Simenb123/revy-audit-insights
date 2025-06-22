
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Audit Action Subject Areas
export const useActionSubjectAreas = (actionId?: string) => {
  return useQuery({
    queryKey: ['action-subject-areas', actionId],
    queryFn: async () => {
      if (!actionId) return [];
      
      const { data, error } = await supabase
        .from('audit_action_subject_areas')
        .select(`
          *,
          subject_area:subject_area_id (*)
        `)
        .eq('action_template_id', actionId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!actionId
  });
};

export const useConnectActionSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ actionId, subjectAreaId }: { actionId: string; subjectAreaId: string }) => {
      const { data, error } = await supabase
        .from('audit_action_subject_areas')
        .insert({ action_template_id: actionId, subject_area_id: subjectAreaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['action-subject-areas', variables.actionId] });
      toast.success('Emneområde koblet til handling');
    },
    onError: (error: any) => {
      toast.error('Feil ved kobling: ' + error.message);
    }
  });
};

export const useDisconnectActionSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ actionId, subjectAreaId }: { actionId: string; subjectAreaId: string }) => {
      const { error } = await supabase
        .from('audit_action_subject_areas')
        .delete()
        .eq('action_template_id', actionId)
        .eq('subject_area_id', subjectAreaId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['action-subject-areas', variables.actionId] });
      toast.success('Emneområde fjernet fra handling');
    },
    onError: (error: any) => {
      toast.error('Feil ved fjerning: ' + error.message);
    }
  });
};

// Document Type Subject Areas
export const useDocumentTypeSubjectAreas = (documentTypeId?: string) => {
  return useQuery({
    queryKey: ['document-type-subject-areas', documentTypeId],
    queryFn: async () => {
      if (!documentTypeId) return [];
      
      const { data, error } = await supabase
        .from('document_type_subject_areas')
        .select(`
          *,
          subject_area:subject_area_id (*)
        `)
        .eq('document_type_id', documentTypeId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!documentTypeId
  });
};

export const useConnectDocumentTypeSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentTypeId, subjectAreaId }: { documentTypeId: string; subjectAreaId: string }) => {
      const { data, error } = await supabase
        .from('document_type_subject_areas')
        .insert({ document_type_id: documentTypeId, subject_area_id: subjectAreaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-type-subject-areas', variables.documentTypeId] });
      toast.success('Emneområde koblet til dokumenttype');
    },
    onError: (error: any) => {
      toast.error('Feil ved kobling: ' + error.message);
    }
  });
};

export const useDisconnectDocumentTypeSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentTypeId, subjectAreaId }: { documentTypeId: string; subjectAreaId: string }) => {
      const { error } = await supabase
        .from('document_type_subject_areas')
        .delete()
        .eq('document_type_id', documentTypeId)
        .eq('subject_area_id', subjectAreaId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-type-subject-areas', variables.documentTypeId] });
      toast.success('Emneområde fjernet fra dokumenttype');
    },
    onError: (error: any) => {
      toast.error('Feil ved fjerning: ' + error.message);
    }
  });
};
