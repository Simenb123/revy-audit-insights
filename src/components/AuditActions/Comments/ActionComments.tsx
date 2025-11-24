import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useActionComments } from '@/hooks/audit-actions/useActionComments';
import { useCreateComment } from '@/hooks/audit-actions/useCreateComment';
import CommentInput from './CommentInput';
import CommentThread from './CommentThread';
import { supabase } from '@/integrations/supabase/client';

interface ActionCommentsProps {
  actionId: string;
}

const ActionComments: React.FC<ActionCommentsProps> = ({ actionId }) => {
  const { data: comments = [], isLoading, refetch } = useActionComments(actionId);
  const createCommentMutation = useCreateComment();

  const unresolvedCount = React.useMemo(() => {
    const countUnresolved = (comments: any[]): number => {
      return comments.reduce((count, comment) => {
        let total = comment.is_resolved ? 0 : 1;
        if (comment.replies) {
          total += countUnresolved(comment.replies);
        }
        return count + total;
      }, 0);
    };
    return countUnresolved(comments);
  }, [comments]);

  useEffect(() => {
    const channel = supabase
      .channel('action-comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_comments',
          filter: `client_audit_action_id=eq.${actionId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [actionId, refetch]);

  const handleSubmitComment = (content: string) => {
    createCommentMutation.mutate({
      client_audit_action_id: actionId,
      content,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle size={18} />
          Kommentarer
          {unresolvedCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {unresolvedCount} uløst
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommentInput
          onSubmit={handleSubmitComment}
          isSubmitting={createCommentMutation.isPending}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Ingen kommentarer ennå. Vær den første til å kommentere!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                actionId={actionId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionComments;
