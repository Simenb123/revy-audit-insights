-- Create tables for collaboration features

-- Dashboard sharing and permissions
CREATE TABLE public.dashboard_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  shared_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id),
  share_type TEXT NOT NULL CHECK (share_type IN ('view', 'edit', 'admin')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dashboard_id, client_id, fiscal_year, shared_with_user_id)
);

-- Comments on dashboards and widgets
CREATE TABLE public.dashboard_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  widget_id TEXT, -- null means comment on entire dashboard
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.dashboard_comments(id),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by_user_id UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dashboard version history
CREATE TABLE public.dashboard_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  widgets_data JSONB NOT NULL,
  layouts_data JSONB NOT NULL,
  settings_data JSONB,
  version_name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dashboard_id, client_id, fiscal_year, version_number)
);

-- Real-time collaboration sessions
CREATE TABLE public.collaboration_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  cursor_position JSONB,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dashboard_id, client_id, fiscal_year, user_id)
);

-- User profiles for display names and avatars
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboard_shares
CREATE POLICY "Users can view shares they created or are shared with" 
ON public.dashboard_shares 
FOR SELECT 
USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Users can create shares for dashboards they own" 
ON public.dashboard_shares 
FOR INSERT 
WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can update shares they created" 
ON public.dashboard_shares 
FOR UPDATE 
USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete shares they created" 
ON public.dashboard_shares 
FOR DELETE 
USING (auth.uid() = shared_by_user_id);

-- RLS Policies for dashboard_comments
CREATE POLICY "Users can view comments on dashboards they have access to" 
ON public.dashboard_comments 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.dashboard_shares ds 
    WHERE ds.dashboard_id = dashboard_comments.dashboard_id 
    AND ds.client_id = dashboard_comments.client_id 
    AND ds.fiscal_year = dashboard_comments.fiscal_year 
    AND ds.shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments on dashboards they have access to" 
ON public.dashboard_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  (EXISTS (
    SELECT 1 FROM public.dashboard_shares ds 
    WHERE ds.dashboard_id = dashboard_comments.dashboard_id 
    AND ds.client_id = dashboard_comments.client_id 
    AND ds.fiscal_year = dashboard_comments.fiscal_year 
    AND ds.shared_with_user_id = auth.uid()
    AND ds.share_type IN ('edit', 'admin')
  ))
);

CREATE POLICY "Users can update their own comments" 
ON public.dashboard_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.dashboard_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for dashboard_versions
CREATE POLICY "Users can view versions of dashboards they have access to" 
ON public.dashboard_versions 
FOR SELECT 
USING (
  auth.uid() = created_by_user_id OR 
  EXISTS (
    SELECT 1 FROM public.dashboard_shares ds 
    WHERE ds.dashboard_id = dashboard_versions.dashboard_id 
    AND ds.client_id = dashboard_versions.client_id 
    AND ds.fiscal_year = dashboard_versions.fiscal_year 
    AND ds.shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions for dashboards they can edit" 
ON public.dashboard_versions 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by_user_id AND
  (EXISTS (
    SELECT 1 FROM public.dashboard_shares ds 
    WHERE ds.dashboard_id = dashboard_versions.dashboard_id 
    AND ds.client_id = dashboard_versions.client_id 
    AND ds.fiscal_year = dashboard_versions.fiscal_year 
    AND ds.shared_with_user_id = auth.uid()
    AND ds.share_type IN ('edit', 'admin')
  ))
);

-- RLS Policies for collaboration_sessions
CREATE POLICY "Users can view active sessions for dashboards they have access to" 
ON public.collaboration_sessions 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.dashboard_shares ds 
    WHERE ds.dashboard_id = collaboration_sessions.dashboard_id 
    AND ds.client_id = collaboration_sessions.client_id 
    AND ds.fiscal_year = collaboration_sessions.fiscal_year 
    AND ds.shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own collaboration sessions" 
ON public.collaboration_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collaboration sessions" 
ON public.collaboration_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collaboration sessions" 
ON public.collaboration_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for user_profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.user_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_dashboard_shares_dashboard ON public.dashboard_shares(dashboard_id, client_id, fiscal_year);
CREATE INDEX idx_dashboard_shares_user ON public.dashboard_shares(shared_with_user_id);
CREATE INDEX idx_dashboard_comments_dashboard ON public.dashboard_comments(dashboard_id, client_id, fiscal_year);
CREATE INDEX idx_dashboard_comments_widget ON public.dashboard_comments(widget_id);
CREATE INDEX idx_dashboard_versions_dashboard ON public.dashboard_versions(dashboard_id, client_id, fiscal_year);
CREATE INDEX idx_collaboration_sessions_dashboard ON public.collaboration_sessions(dashboard_id, client_id, fiscal_year);
CREATE INDEX idx_collaboration_sessions_active ON public.collaboration_sessions(is_active, last_seen);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboard_shares_updated_at
  BEFORE UPDATE ON public.dashboard_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_comments_updated_at
  BEFORE UPDATE ON public.dashboard_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaboration_sessions_updated_at
  BEFORE UPDATE ON public.collaboration_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time subscriptions
ALTER TABLE public.dashboard_shares REPLICA IDENTITY FULL;
ALTER TABLE public.dashboard_comments REPLICA IDENTITY FULL;
ALTER TABLE public.dashboard_versions REPLICA IDENTITY FULL;
ALTER TABLE public.collaboration_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;