
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export function useReviewAuditLog() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('audit_logs')
        .update({
          is_reviewed: true,
          reviewed_at: new Date().toISOString(),
          reviewer_id: session.user.id
        })
        .eq('id', logId);

      if (error) throw error;

      return logId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      toast({
        title: "Logg anmeldt",
        description: "Revisjonsloggen er markert som anmeldt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved anmeldelse",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
