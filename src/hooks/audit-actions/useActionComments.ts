import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActionComment {
  id: string;
  client_audit_action_id: string;
  user_id: string;
  content: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  resolver?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  replies?: ActionComment[];
}

export const useActionComments = (actionId: string | undefined) => {
  return useQuery({
    queryKey: ['action-comments', actionId],
    queryFn: async () => {
      if (!actionId) return [];

      const { data, error } = await supabase
        .from('action_comments')
        .select(`
          *,
          user:profiles!action_comments_user_id_fkey(id, email, full_name),
          resolver:profiles!action_comments_resolved_by_fkey(id, email, full_name)
        `)
        .eq('client_audit_action_id', actionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Build threaded structure
      const commentsMap = new Map<string, ActionComment>();
      const rootComments: ActionComment[] = [];

      data?.forEach((comment: any) => {
        const commentWithReplies = { ...comment, replies: [] };
        commentsMap.set(comment.id, commentWithReplies);
      });

      data?.forEach((comment: any) => {
        const commentObj = commentsMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      return rootComments;
    },
    enabled: !!actionId,
    staleTime: 30000,
  });
};
