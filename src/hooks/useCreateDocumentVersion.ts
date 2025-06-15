
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useCreateAuditLog } from './useCreateAuditLog';

interface CreateVersionParams {
  clientAuditActionId: string;
  content: string;
  versionName: string;
  changeSource: 'user' | 'ai';
  changeDescription?: string;
  // For logging
  clientId: string;
  subjectArea: string;
  actionName: string;
}

export function useCreateDocumentVersion() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async (params: CreateVersionParams) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          client_audit_action_id: params.clientAuditActionId,
          content: params.content,
          version_name: params.versionName,
          change_source: params.changeSource,
          change_description: params.changeDescription,
          created_by_user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentVersions', data.client_audit_action_id] });

      createAuditLog.mutate({
        clientId: variables.clientId,
        actionType: 'document_version_created',
        areaName: variables.subjectArea,
        description: `Opprettet versjon '${variables.versionName}' for handling "${variables.actionName}". Kilde: ${variables.changeSource}.`,
        metadata: { 
          client_audit_action_id: variables.clientAuditActionId,
          document_version_id: data.id 
        }
      });
    },
  });
}
