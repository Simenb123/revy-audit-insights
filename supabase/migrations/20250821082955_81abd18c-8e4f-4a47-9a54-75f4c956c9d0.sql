-- Revisorskolen Training System - Phase 1: Database Foundation

-- Program & sesjoner
CREATE TABLE public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  session_index int CHECK (session_index BETWEEN 1 AND 5),
  title text NOT NULL,
  slug text UNIQUE,
  summary text,
  goals jsonb DEFAULT '[]'::jsonb,
  open_at timestamptz,
  is_published boolean DEFAULT false,
  ai_mode text DEFAULT 'school',
  default_params jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tilgang & progresjon
CREATE TABLE public.training_session_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now()
);

CREATE TABLE public.training_session_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  status text CHECK (status IN ('locked','in_progress','completed')) DEFAULT 'locked',
  time_spent_minutes int DEFAULT 0,
  score jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Handlingskatalog for scenario/sesjon
CREATE TABLE public.training_actions_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  category text,
  title text NOT NULL,
  description text,
  time_cost_minutes numeric DEFAULT 0,
  isa_refs jsonb DEFAULT '[]'::jsonb,
  assertions jsonb DEFAULT '[]'::jsonb,
  reveal_markdown text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.training_run_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action_code text NOT NULL,
  minutes_cost numeric DEFAULT 0,
  revealed_key text,
  revealed_text_md text,
  created_at timestamptz DEFAULT now()
);

-- Bibliotek-tilknytning til eksisterende knowledge_articles
CREATE TABLE public.training_library_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.training_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES public.training_library_collections(id) ON DELETE CASCADE,
  article_id uuid REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, article_id)
);

CREATE TABLE public.training_session_library (
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.training_library_collections(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (session_id, collection_id)
);

-- Sampling tabeller (lettvekts)
CREATE TABLE public.sampling_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  population_size numeric DEFAULT 0,
  budget_hours numeric DEFAULT 0,
  pm numeric DEFAULT 0,
  tm numeric DEFAULT 0,
  cl numeric DEFAULT 0.95,
  em numeric DEFAULT 0,
  seed text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sampling_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.sampling_runs(id) ON DELETE CASCADE,
  method text CHECK (method IN ('threshold','mus','strata','random','judgemental')),
  params jsonb DEFAULT '{}'::jsonb,
  selected_ids jsonb DEFAULT '[]'::jsonb,
  coverage_amount numeric DEFAULT 0,
  coverage_count int DEFAULT 0,
  hours_est numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sampling_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id uuid REFERENCES public.sampling_selections(id) ON DELETE CASCADE,
  txn_id text NOT NULL,
  finding_amount numeric DEFAULT 0,
  finding_type text,
  notes text,
  tested_at timestamptz DEFAULT now()
);

CREATE TABLE public.sampling_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.sampling_runs(id) ON DELETE CASCADE,
  projected_misstatement numeric DEFAULT 0,
  upper_misstatement numeric DEFAULT 0,
  conclusion text,
  finalized_by uuid REFERENCES auth.users(id),
  finalized_at timestamptz
);

-- Enable RLS on all tables
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_actions_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_run_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_library_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sampling_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sampling_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sampling_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sampling_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Training programs - readable by authenticated users, manageable by admins
CREATE POLICY "Authenticated users can view training programs" 
ON public.training_programs FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage training programs" 
ON public.training_programs FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- Training sessions - readable by authenticated users, manageable by admins
CREATE POLICY "Authenticated users can view published training sessions" 
ON public.training_sessions FOR SELECT 
USING (auth.role() = 'authenticated' AND is_published = true);

CREATE POLICY "Admins can manage training sessions" 
ON public.training_sessions FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- Session access - users can view their own access, admins can manage
CREATE POLICY "Users can view their own session access" 
ON public.training_session_access FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage session access" 
ON public.training_session_access FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- Session progress - users manage their own progress
CREATE POLICY "Users can manage their own session progress" 
ON public.training_session_progress FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Actions catalog - readable by authenticated users, manageable by admins
CREATE POLICY "Authenticated users can view actions catalog" 
ON public.training_actions_catalog FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage actions catalog" 
ON public.training_actions_catalog FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- Run choices - users manage their own choices
CREATE POLICY "Users can manage their own run choices" 
ON public.training_run_choices FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Library collections - readable by authenticated users, manageable by admins
CREATE POLICY "Authenticated users can view library collections" 
ON public.training_library_collections FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage library collections" 
ON public.training_library_collections FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- Library items - readable by authenticated users, manageable by admins
CREATE POLICY "Authenticated users can view library items" 
ON public.training_library_items FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage library items" 
ON public.training_library_items FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- Session library - readable by authenticated users, manageable by admins
CREATE POLICY "Authenticated users can view session library" 
ON public.training_session_library FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage session library" 
ON public.training_session_library FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- Sampling runs - users manage their own runs
CREATE POLICY "Users can manage their own sampling runs" 
ON public.sampling_runs FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Sampling selections - users manage their own selections
CREATE POLICY "Users can manage their own sampling selections" 
ON public.sampling_selections FOR ALL 
USING (run_id IN (SELECT id FROM public.sampling_runs WHERE user_id = auth.uid()))
WITH CHECK (run_id IN (SELECT id FROM public.sampling_runs WHERE user_id = auth.uid()));

-- Sampling tests - users manage their own tests
CREATE POLICY "Users can manage their own sampling tests" 
ON public.sampling_tests FOR ALL 
USING (selection_id IN (SELECT s.id FROM public.sampling_selections s JOIN public.sampling_runs r ON s.run_id = r.id WHERE r.user_id = auth.uid()))
WITH CHECK (selection_id IN (SELECT s.id FROM public.sampling_selections s JOIN public.sampling_runs r ON s.run_id = r.id WHERE r.user_id = auth.uid()));

-- Sampling results - users manage their own results
CREATE POLICY "Users can manage their own sampling results" 
ON public.sampling_results FOR ALL 
USING (run_id IN (SELECT id FROM public.sampling_runs WHERE user_id = auth.uid()))
WITH CHECK (run_id IN (SELECT id FROM public.sampling_runs WHERE user_id = auth.uid()));

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_training_session_progress_updated_at
  BEFORE UPDATE ON public.training_session_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();