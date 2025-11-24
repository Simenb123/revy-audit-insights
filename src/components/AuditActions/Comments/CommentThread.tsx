import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle2, MoreVertical, Trash2, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { ActionComment } from '@/hooks/audit-actions/useActionComments';
import CommentInput from './CommentInput';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreateComment } from '@/hooks/audit-actions/useCreateComment';
import { useResolveComment } from '@/hooks/audit-actions/useResolveComment';
import { useDeleteComment } from '@/hooks/audit-actions/useDeleteComment';
import { supabase } from '@/integrations/supabase/client';

interface CommentThreadProps {
  comment: ActionComment;
  actionId: string;
  depth?: number;
}

const CommentThread: React.FC<CommentThreadProps> = ({ comment, actionId, depth = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const createCommentMutation = useCreateComment();
  const resolveCommentMutation = useResolveComment();
  const deleteCommentMutation = useDeleteComment();

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const handleReply = (content: string) => {
    createCommentMutation.mutate(
      {
        client_audit_action_id: actionId,
        content,
        parent_comment_id: comment.id,
      },
      {
        onSuccess: () => setShowReplyInput(false),
      }
    );
  };

  const handleResolve = () => {
    resolveCommentMutation.mutate({
      commentId: comment.id,
      actionId,
      isResolved: !comment.is_resolved,
    });
  };

  const handleDelete = () => {
    if (confirm('Er du sikker på at du vil slette denne kommentaren?')) {
      deleteCommentMutation.mutate({
        commentId: comment.id,
        actionId,
      });
    }
  };

  const isOwnComment = currentUserId === comment.user_id;

  return (
    <div className={depth > 0 ? 'ml-8 mt-2' : ''}>
      <Card className={comment.is_resolved ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {comment.user?.full_name || comment.user?.email || 'Ukjent'}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(comment.created_at), { 
                  addSuffix: true, 
                  locale: nb 
                })}
              </span>
              {comment.is_resolved && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle2 size={12} />
                  Løst
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleResolve}>
                  <CheckCircle2 size={14} className="mr-2" />
                  {comment.is_resolved ? 'Marker som uløst' : 'Marker som løst'}
                </DropdownMenuItem>
                {depth === 0 && (
                  <DropdownMenuItem onClick={() => setShowReplyInput(!showReplyInput)}>
                    <Reply size={14} className="mr-2" />
                    Svar
                  </DropdownMenuItem>
                )}
                {isOwnComment && (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 size={14} className="mr-2" />
                    Slett
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

          {comment.is_resolved && comment.resolver && (
            <div className="text-xs text-muted-foreground mt-2">
              Løst av {comment.resolver.full_name || comment.resolver.email} {' '}
              {formatDistanceToNow(new Date(comment.resolved_at!), { 
                addSuffix: true, 
                locale: nb 
              })}
            </div>
          )}

          {showReplyInput && (
            <div className="mt-3 pt-3 border-t">
              <CommentInput
                onSubmit={handleReply}
                placeholder="Skriv et svar..."
                isSubmitting={createCommentMutation.isPending}
                autoFocus
              />
            </div>
          )}
        </CardContent>
      </Card>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              actionId={actionId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
