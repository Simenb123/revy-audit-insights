import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteCommentParams {
  commentId: string;
  actionId: string;
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }: DeleteCommentParams) => {
      const { error } = await supabase
        .from('action_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['action-comments', variables.actionId] 
      });
      toast.success('Kommentar slettet');
    },
    onError: (error) => {
      console.error('Failed to delete comment:', error);
      toast.error('Kunne ikke slette kommentar');
    },
  });
};
