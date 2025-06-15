import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';
import { DocumentVersion } from '@/hooks/useDocumentVersions';
import { Client, ClientAuditAction } from '@/types/revio';

interface RestoreVersionParams {
  version: DocumentVersion;
  client: Client;
  action: ClientAuditAction;
}

export function useRestoreDocumentVersion(onSuccessCallback: (content: string) => void) {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async ({ version }: RestoreVersionParams) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('client_audit_actions')
        .update({
          procedures: version.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', version.client_audit_action_id);

      if (updateError) throw updateError;
      
      return version;
    },
    onSuccess: (version, { client, action }) => {
      queryClient.invalidateQueries({ queryKey: ['auditActionDemo', client.id] });
      
      createAuditLog.mutate({
        clientId: client.id,
        actionType: 'document_version_restored',
        areaName: action.subject_area,
        description: `Gjenopprettet versjon '${version.version_name}' for handling "${action.name}".`,
        metadata: { 
          client_audit_action_id: action.id,
          document_version_id: version.id 
        }
      });
      
      toast({
        title: "Versjon gjenopprettet",
        description: `Innholdet er tilbakestilt til versjonen fra ${new Date(version.created_at).toLocaleString()}.`,
      });

      onSuccessCallback(version.content);
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved gjenoppretting",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
