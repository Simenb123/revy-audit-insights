
-- Create learning paths table for structured training programs
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  is_mandatory BOOLEAN DEFAULT false,
  target_role TEXT, -- 'new_hire', 'junior', 'senior', etc.
  certification_required BOOLEAN DEFAULT true,
  minimum_score INTEGER DEFAULT 80,
  created_by UUID REFERENCES auth.users,
  audit_firm_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning path modules (weekly structure)
CREATE TABLE public.learning_path_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  estimated_hours NUMERIC,
  is_mandatory BOOLEAN DEFAULT true,
  unlock_after_days INTEGER DEFAULT 0, -- Days after program start when this unlocks
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(learning_path_id, week_number, sort_order)
);

-- Create user enrollments in learning paths
CREATE TABLE public.user_learning_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  enrolled_by UUID REFERENCES auth.users, -- Manager who enrolled them
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  current_week INTEGER DEFAULT 1,
  overall_score NUMERIC,
  certification_earned BOOLEAN DEFAULT false,
  certification_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, learning_path_id)
);

-- Create module completions tracking
CREATE TABLE public.user_module_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.user_learning_enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.learning_path_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  time_spent_minutes INTEGER,
  attempts INTEGER DEFAULT 1,
  feedback TEXT,
  approved_by UUID REFERENCES auth.users, -- Manager approval if required
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, module_id)
);

-- Create certifications table
CREATE TABLE public.learning_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id),
  enrollment_id UUID NOT NULL REFERENCES public.user_learning_enrollments(id),
  certificate_number TEXT UNIQUE NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  final_score NUMERIC NOT NULL,
  issued_by UUID REFERENCES auth.users,
  certificate_data JSONB, -- Store certificate details for PDF generation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create manager notifications table
CREATE TABLE public.learning_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users, -- Who to notify
  enrollment_id UUID REFERENCES public.user_learning_enrollments(id),
  notification_type TEXT NOT NULL, -- 'overdue', 'completed', 'needs_approval', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Connect existing training progress to learning paths
ALTER TABLE public.training_progress 
ADD COLUMN learning_path_id UUID REFERENCES public.learning_paths(id),
ADD COLUMN enrollment_id UUID REFERENCES public.user_learning_enrollments(id);

-- Enable RLS on all new tables
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_paths (readable by all in firm, manageable by admins)
CREATE POLICY "Users can view learning paths in their firm" 
  ON public.learning_paths FOR SELECT 
  USING (
    audit_firm_id = (SELECT audit_firm_id FROM public.profiles WHERE id = auth.uid()) OR
    audit_firm_id IS NULL -- System-wide programs
  );

CREATE POLICY "Admins can manage learning paths" 
  ON public.learning_paths FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'partner')
    )
  );

-- RLS Policies for enrollments (users see own, managers see their reports)
CREATE POLICY "Users can view their own enrollments" 
  ON public.user_learning_enrollments FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view enrollments in their firm" 
  ON public.user_learning_enrollments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.audit_firm_id = p2.audit_firm_id
      WHERE p1.id = auth.uid() 
      AND p2.id = user_id
      AND p1.user_role IN ('admin', 'partner', 'manager')
    )
  );

CREATE POLICY "Managers can create enrollments" 
  ON public.user_learning_enrollments FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'partner', 'manager')
    )
  );

-- RLS Policies for module completions (users own data, managers can view)
CREATE POLICY "Users can manage their own completions" 
  ON public.user_module_completions FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_learning_enrollments 
      WHERE id = enrollment_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view completions in their firm" 
  ON public.user_module_completions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_learning_enrollments ule
      JOIN public.profiles p1 ON ule.user_id = p1.id
      JOIN public.profiles p2 ON p1.audit_firm_id = p2.audit_firm_id
      WHERE ule.id = enrollment_id 
      AND p2.id = auth.uid()
      AND p2.user_role IN ('admin', 'partner', 'manager')
    )
  );

-- Generate certificate number function
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

-- Insert default 4-week new hire program
INSERT INTO public.learning_paths (name, description, duration_weeks, is_mandatory, target_role, certification_required, minimum_score) 
VALUES (
  'Nyansatt Revisjonsprogram',
  'Komplett 4-ukers opplæringsprogram for nye revisorer. Dekker grunnleggende revisjonsprinsipper, risikovurdering, testing og dokumentasjon.',
  4,
  true,
  'new_hire',
  true,
  80
);

-- Get the ID of the newly created learning path
DO $$
DECLARE
  path_id UUID;
BEGIN
  SELECT id INTO path_id FROM public.learning_paths WHERE name = 'Nyansatt Revisjonsprogram';
  
  -- Insert the 4 weekly modules
  INSERT INTO public.learning_path_modules (learning_path_id, week_number, name, description, estimated_hours, unlock_after_days, sort_order) VALUES
  (path_id, 1, 'Uke 1: Grunnleggende Revisjon', 'Introduksjon til revisjon, lover og regler, etikk og uavhengighet', 20, 0, 1),
  (path_id, 2, 'Uke 2: Risikovurdering og Planlegging', 'Foretaksrisiko, revisjonsrisiko, materialitet og planlegging av revisjonen', 20, 7, 2),
  (path_id, 3, 'Uke 3: Revisjonstesting og Bevis', 'Substanstesting, kontroller, prøver og dokumentasjon av revisjonsarbeid', 25, 14, 3),
  (path_id, 4, 'Uke 4: Konklusjon og Rapportering', 'Evaluering av funn, revisjonsberetning og kommunikasjon med klient', 15, 21, 4);
END $$;
