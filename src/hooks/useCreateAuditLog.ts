
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface CreateAuditLogParams {
  clientId: string;
  actionType: 'review_completed' | 'task_assigned' | 'document_uploaded' | 'analysis_performed';
  areaName: string;
  description?: string;
  metadata?: any;
}

export function useCreateAuditLog() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAuditLogParams) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          client_id: params.clientId,
          user_id: session.user.id,
          action_type: params.actionType,
          area_name: params.areaName,
          description: params.description,
          metadata: params.metadata,
          is_reviewed: false
        });

      if (error) throw error;

      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved logging",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
