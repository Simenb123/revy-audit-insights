-- Create training scenarios table
CREATE TABLE public.training_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT NOT NULL,
  company_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  initial_budget NUMERIC(10,2) NOT NULL DEFAULT 10000,
  target_actions INTEGER NOT NULL DEFAULT 10,
  difficulty_level TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER DEFAULT 30,
  learning_objectives TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create training runs table
CREATE TABLE public.training_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.training_scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_budget NUMERIC(10,2) NOT NULL,
  actions_taken INTEGER NOT NULL DEFAULT 0,
  current_step INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_score INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create training actions table
CREATE TABLE public.training_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.training_scenarios(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  reveal_text TEXT,
  score_impact INTEGER DEFAULT 0,
  risk_impact TEXT DEFAULT 'neutral' CHECK (risk_impact IN ('positive', 'neutral', 'negative')),
  prerequisites JSONB DEFAULT '[]'::jsonb,
  consequences JSONB DEFAULT '{}'::jsonb,
  is_mandatory BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create training run states table  
CREATE TABLE public.training_run_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.training_runs(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.training_actions(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cost_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_training_runs_user_id ON public.training_runs(user_id);
CREATE INDEX idx_training_runs_scenario_id ON public.training_runs(scenario_id);
CREATE INDEX idx_training_actions_scenario_id ON public.training_actions(scenario_id);
CREATE INDEX idx_training_run_states_run_id ON public.training_run_states(run_id);

-- Enable RLS on all tables
ALTER TABLE public.training_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_run_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_scenarios
CREATE POLICY "Users can view active training scenarios" 
ON public.training_scenarios FOR SELECT 
USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage training scenarios" 
ON public.training_scenarios FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]));

-- RLS Policies for training_runs
CREATE POLICY "Users can manage their own training runs" 
ON public.training_runs FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for training_actions
CREATE POLICY "Users can view training actions for active scenarios" 
ON public.training_actions FOR SELECT 
USING (auth.role() = 'authenticated' AND scenario_id IN (
  SELECT id FROM public.training_scenarios WHERE is_active = true
));

CREATE POLICY "Admins can manage training actions" 
ON public.training_actions FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]));

-- RLS Policies for training_run_states
CREATE POLICY "Users can manage states for their own runs" 
ON public.training_run_states FOR ALL 
USING (run_id IN (
  SELECT id FROM public.training_runs WHERE user_id = auth.uid()
));

-- Insert seed data for Nordic Varehandel AS scenario
INSERT INTO public.training_scenarios (
  title,
  description,
  company_name,
  company_context,
  initial_budget,
  target_actions,
  difficulty_level,
  estimated_duration_minutes,
  learning_objectives
) VALUES (
  'Nordic Varehandel AS - Første gangs revisjon',
  'Et nordisk handelsselskap med komplekse varestrømmer og internasjonale transaksjoner. Selskapet har aldri vært revidert før og har begrenset internkontroll.',
  'Nordic Varehandel AS',
  '{"industry": "retail", "employees": 45, "revenue": "NOK 85M", "complexity": "medium", "risk_areas": ["inventory", "foreign_exchange", "internal_controls"]}'::jsonb,
  10000,
  8,
  'beginner',
  45,
  ARRAY[
    'Forstå klientens forretningsmodell og risikofaktorer',
    'Identifisere vesentlige regnskapsområder',
    'Planlegge revisjonsstrategi innenfor budsjett',
    'Balansere kostnader mot revisjonsrisiko'
  ]
);

-- Get the scenario ID for inserting actions
DO $$
DECLARE
    scenario_uuid UUID;
BEGIN
    SELECT id INTO scenario_uuid FROM public.training_scenarios WHERE company_name = 'Nordic Varehandel AS';
    
    -- Insert training actions for Nordic Varehandel AS
    INSERT INTO public.training_actions (scenario_id, step_number, action_type, title, description, cost, reveal_text, score_impact, risk_impact, sort_order) VALUES
    (scenario_uuid, 1, 'planning', 'Forstå virksomheten', 'Gjennomfør en grundig forretningsforståelse gjennom intervjuer med ledelsen og gjennomgang av selskapets forretningsmodell.', 1500, 'Du får innsikt i at selskapet har komplekse varestrømmer fra 3 land og bruker 2 valutaer. Ledelsen har begrenset regnskapserfaring.', 15, 'positive', 1),
    (scenario_uuid, 1, 'planning', 'Analytisk gjennomgang', 'Utfør analytiske handlinger på nøkkeltall og trender for å identifisere potensielle risiko- og vesentlighetsområder.', 800, 'Varelageromsetningen har falt fra 6x til 4x siste år. Bruttomargin har økt uventet med 3%. Dette indikerer potensielle lagerverderings- og innkjøpsproblemer.', 10, 'positive', 2),
    (scenario_uuid, 1, 'planning', 'Rask oppstart', 'Start direkte med substansrevisjon av de største postene uten omfattende planlegging.', 500, 'Du sparer tid initialt, men oppdager senere at du manglet kritisk informasjon om selskapets systemer og kontroller. Dette fører til ineffektiv revisjon.', -5, 'negative', 3),
    
    (scenario_uuid, 2, 'execution', 'Lagerrevisjon', 'Gjennomfør detaljert telling og verdivurdering av varelager, inkludert observasjon av lagertelling.', 2000, 'Du finner betydelige avvik i lagertellingen og identifiserer ukurans for NOK 450.000. Bokført verdi må reduseres.', 20, 'positive', 4),
    (scenario_uuid, 2, 'execution', 'Stikkprøvekontroll lager', 'Utfør begrenset stikkprøvetesting av lager uten fysisk telling.', 600, 'Du får begrenset sikkerhet, men fanger ikke opp de største feilene. Risikoen for vesentlig feilinformasjon øker betydelig.', -10, 'negative', 5),
    
    (scenario_uuid, 3, 'execution', 'Kundefordringer', 'Test aldersfordelingen av kundefordringer og vurder tapsavsetninger grundig.', 1200, 'Du identifiserer at 15% av fordringene er over 90 dager gamle, og flere store kunder har betalingsproblemer. Tapsavsetning må økes med NOK 280.000.', 15, 'positive', 6),
    (scenario_uuid, 3, 'execution', 'Leverandørgjeld', 'Bekreft leverandørgjeld gjennom sirkulering og avstemming mot leverandørreskontra.', 900, 'Du finner flere uregistrerte leverandørfakturaer verdt NOK 320.000 som påvirker årsresultatet negativt.', 12, 'positive', 7),
    
    (scenario_uuid, 4, 'reporting', 'Omfattende rapportering', 'Utarbeid detaljert revisjonsberetning med alle funn og anbefalinger.', 1800, 'Du leverer en grundig rapport som gir stor verdi til ledelsen, men bruker mye av det resterende budsjettet.', 25, 'positive', 8),
    (scenario_uuid, 4, 'reporting', 'Standardrapportering', 'Lever en standardisert revisjonsberetning uten utdypende kommentarer.', 600, 'Rapporten oppfyller minimumskravene, men gir begrenset verdi til klienten. Mulighet for oppfølgingsoppdrag reduseres.', 5, 'neutral', 9);
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at_training()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_training_scenarios_updated_at
  BEFORE UPDATE ON public.training_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_training();

CREATE TRIGGER set_training_runs_updated_at
  BEFORE UPDATE ON public.training_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_training();

CREATE TRIGGER set_training_actions_updated_at
  BEFORE UPDATE ON public.training_actions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_training();