
-- Create tables for the training/learning system
CREATE TABLE public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  scenario_id UUID REFERENCES public.test_scenarios NOT NULL,
  module_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  max_score INTEGER,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, scenario_id, module_name)
);

-- Create table for user badges/achievements
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scenario_id UUID REFERENCES public.test_scenarios,
  points_earned INTEGER DEFAULT 0
);

-- Create table for quiz questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID REFERENCES public.test_scenarios,
  module_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  correct_answer TEXT NOT NULL,
  options JSONB,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  difficulty_level TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for training_progress
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own training progress" 
  ON public.training_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training progress" 
  ON public.training_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training progress" 
  ON public.training_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add RLS policies for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges" 
  ON public.user_badges 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
  ON public.user_badges 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for quiz_questions (public read access)
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quiz questions" 
  ON public.quiz_questions 
  FOR SELECT 
  USING (true);

-- Insert some sample quiz questions
INSERT INTO public.quiz_questions (scenario_id, module_name, question_text, question_type, correct_answer, options, explanation, points, difficulty_level) VALUES
(
  (SELECT id FROM public.test_scenarios WHERE name = 'Nordic Varehandel AS' LIMIT 1),
  'risikovurdering',
  'Hvilken risikofaktor er mest relevant for et varehandelsselskap?',
  'multiple_choice',
  'Lagervurdering og svinn',
  '["Lagervurdering og svinn", "Immaterielle eiendeler", "Finansielle instrumenter", "Pensjonsforpliktelser"]',
  'Varehandelsselskaper har typisk store lagerbeholdninger som krever nøye vurdering av verdifall og svinn.',
  15,
  'medium'
),
(
  (SELECT id FROM public.test_scenarios WHERE name = 'TechConsult Solutions AS' LIMIT 1),
  'risikovurdering',
  'Hva er hovedrisikoen for et IT-konsulentselskap?',
  'multiple_choice',
  'Inntektsføring av prosjekter',
  '["Inntektsføring av prosjekter", "Varelager", "Anleggsmidler", "Valutarisiko"]',
  'IT-konsulentselskaper har komplekse prosjekter hvor inntektsføring over tid kan være utfordrende.',
  15,
  'medium'
),
(
  null,
  'generell',
  'Hva er formålet med materialitetsberegning i revisjon?',
  'multiple_choice',
  'Bestemme størrelsen på feil som kan påvirke brukerens beslutninger',
  '["Bestemme størrelsen på feil som kan påvirke brukerens beslutninger", "Beregne revisjonshonorar", "Vurdere selskapets lønnsomhet", "Planlegge tidsbruken"]',
  'Materialitet definerer hvor store feil som kan aksepteres før de påvirker regnskapsbrukernes økonomiske beslutninger.',
  10,
  'easy'
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_training_progress_updated_at
  BEFORE UPDATE ON public.training_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
