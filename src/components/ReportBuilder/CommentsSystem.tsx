import React, { useState } from 'react';
import { useCollaboration, Comment } from '@/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageCircle, Check, Reply, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CommentsSystemProps {
  dashboardId: string;
  clientId: string;
  fiscalYear: number;
  widgetId?: string;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  onResolve: (commentId: string) => void;
  canResolve: boolean;
  level?: number;
}

function CommentItem({ comment, onReply, onResolve, canResolve, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    }
  };

  const getUserInitials = (displayName: string | null) => {
    if (!displayName) return '?';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={cn('space-y-3', level > 0 && 'ml-8 border-l-2 border-muted pl-4')}>
      <Card className={cn(comment.resolved && 'opacity-60 bg-muted/30')}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user?.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {getUserInitials(comment.user?.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {comment.user?.display_name || 'Unknown User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {comment.resolved && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Resolved
                </Badge>
              )}
              {!comment.resolved && canResolve && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResolve(comment.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm whitespace-pre-wrap mb-3">{comment.content}</p>
          
          {!comment.resolved && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            </div>
          )}
          
          {showReplyForm && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply}>
                  Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Render replies */}
      {comment.replies?.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onResolve={onResolve}
          canResolve={canResolve}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export function CommentsSystem({ 
  dashboardId, 
  clientId, 
  fiscalYear, 
  widgetId,
  className 
}: CommentsSystemProps) {
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  
  const { 
    comments, 
    currentUser, 
    addComment, 
    resolveComment 
  } = useCollaboration(dashboardId, clientId, fiscalYear);

  // Filter comments for specific widget if provided
  const relevantComments = widgetId 
    ? comments.filter(c => c.widget_id === widgetId)
    : comments.filter(c => !c.widget_id);

  const unresolvedCount = relevantComments.filter(c => !c.resolved).length;

  const handleAddComment = async () => {
    if (newComment.trim() && currentUser) {
      try {
        await addComment(newComment, widgetId);
        setNewComment('');
        setShowCommentForm(false);
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
    }
  };

  const handleReply = async (parentCommentId: string, content: string) => {
    if (currentUser) {
      try {
        await addComment(content, widgetId, parentCommentId);
      } catch (error) {
        console.error('Failed to add reply:', error);
      }
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await resolveComment(commentId);
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className={cn('text-center py-4', className)}>
        <p className="text-sm text-muted-foreground">
          Please sign in to view and add comments
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-medium">
            Comments {unresolvedCount > 0 && `(${unresolvedCount} unresolved)`}
          </h3>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCommentForm(!showCommentForm)}
        >
          {showCommentForm ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
          {showCommentForm ? 'Cancel' : 'Add Comment'}
        </Button>
      </div>

      {showCommentForm && (
        <Card>
          <CardContent className="pt-4">
            <Textarea
              placeholder={widgetId ? "Comment on this widget..." : "Comment on this dashboard..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] mb-3"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Add Comment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentForm(false);
                  setNewComment('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {relevantComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No comments yet. Be the first to add one!
            </p>
          </div>
        ) : (
          relevantComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onResolve={handleResolve}
              canResolve={true}
            />
          ))
        )}
      </div>
    </div>
  );
}