-- AI Multi-Agent Studio database schema
-- Tables for storing multi-agent conversations and custom roles

-- AI conversations for multi-agent discussions
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT,
  idea TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  agents JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI messages within conversations
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  agent_key TEXT,
  agent_name TEXT,
  content TEXT NOT NULL,
  turn_index INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom AI agent roles (extends existing ai_revy_variants)
CREATE TABLE IF NOT EXISTS public.ai_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_firm_id UUID REFERENCES public.audit_firms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-5-mini',
  temperature NUMERIC,
  data_scopes JSONB DEFAULT '[]',
  data_topics JSONB DEFAULT '[]',
  allowed_sources JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can manage their own conversations" 
ON public.ai_conversations 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for ai_messages
CREATE POLICY "Users can manage messages in their conversations" 
ON public.ai_messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c 
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

-- RLS Policies for ai_custom_roles
CREATE POLICY "Users can manage their own custom roles" 
ON public.ai_custom_roles 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Firm members can view shared custom roles" 
ON public.ai_custom_roles 
FOR SELECT 
USING (
  audit_firm_id IS NOT NULL AND 
  audit_firm_id IN (
    SELECT p.audit_firm_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON public.ai_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_messages_conversation_id_idx ON public.ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS ai_custom_roles_user_firm_idx ON public.ai_custom_roles(user_id, audit_firm_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_custom_roles_updated_at
  BEFORE UPDATE ON public.ai_custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();