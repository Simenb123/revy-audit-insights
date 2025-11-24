import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResolveCommentParams {
  commentId: string;
  actionId: string;
  isResolved: boolean;
}

export const useResolveComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, isResolved }: ResolveCommentParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('action_comments')
        .update({
          is_resolved: isResolved,
          resolved_by: isResolved ? user.id : null,
          resolved_at: isResolved ? new Date().toISOString() : null,
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['action-comments', variables.actionId] 
      });
      toast.success(variables.isResolved ? 'Kommentar løst' : 'Kommentar gjenåpnet');
    },
    onError: (error) => {
      console.error('Failed to resolve comment:', error);
      toast.error('Kunne ikke oppdatere kommentar');
    },
  });
};
