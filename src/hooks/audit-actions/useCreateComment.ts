import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateCommentParams {
  client_audit_action_id: string;
  content: string;
  parent_comment_id?: string | null;
}

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCommentParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('action_comments')
        .insert({
          client_audit_action_id: params.client_audit_action_id,
          user_id: user.id,
          content: params.content,
          parent_comment_id: params.parent_comment_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['action-comments', variables.client_audit_action_id] 
      });
      toast.success('Kommentar lagt til');
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
      toast.error('Kunne ikke legge til kommentar');
    },
  });
};
