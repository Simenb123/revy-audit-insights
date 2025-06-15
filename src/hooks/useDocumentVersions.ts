
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentVersion {
  id: string;
  client_audit_action_id: string;
  content: string;
  version_name: string;
  change_source: 'user' | 'ai';
  change_description: string | null;
  created_by_user_id: string | null;
  created_at: string;
}

export function useDocumentVersions(clientAuditActionId: string | undefined) {
  return useQuery({
    queryKey: ['documentVersions', clientAuditActionId],
    queryFn: async (): Promise<DocumentVersion[]> => {
      if (!clientAuditActionId) return [];
      
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('client_audit_action_id', clientAuditActionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching document versions:', error);
        throw error;
      }

      return data;
    },
    enabled: !!clientAuditActionId,
  });
}
