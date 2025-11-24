-- Create action_comments table for collaboration on audit actions
CREATE TABLE action_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_audit_action_id UUID NOT NULL REFERENCES client_audit_actions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  parent_comment_id UUID REFERENCES action_comments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE action_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for action_comments
-- Authenticated users can view all comments (will be refined later based on firm access)
CREATE POLICY "Authenticated users can view action comments"
ON action_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can create comments
CREATE POLICY "Authenticated users can create action comments"
ON action_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own action comments"
ON action_comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own action comments"
ON action_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_action_comments_updated_at
BEFORE UPDATE ON action_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_action_comments_client_audit_action_id ON action_comments(client_audit_action_id);
CREATE INDEX idx_action_comments_parent_comment_id ON action_comments(parent_comment_id);
CREATE INDEX idx_action_comments_is_resolved ON action_comments(is_resolved);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE action_comments;