
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface CreateVersionParams {
  clientAuditActionId: string;
  content: string;
  versionName: string;
  changeSource: 'user' | 'ai';
  changeDescription?: string;
}

export function useCreateDocumentVersion() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documentVersions', data.client_audit_action_id] });
    },
  });
}
