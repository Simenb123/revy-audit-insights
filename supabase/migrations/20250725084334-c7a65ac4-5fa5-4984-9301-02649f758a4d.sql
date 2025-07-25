-- Create audit action area mappings
CREATE TABLE public.audit_action_area_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE,
  audit_area_id UUID REFERENCES public.audit_areas(id) ON DELETE CASCADE,
  relevance_level TEXT NOT NULL DEFAULT 'primary' CHECK (relevance_level IN ('primary', 'secondary', 'optional')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_template_id, audit_area_id)
);

-- Create audit action risk mappings
CREATE TABLE public.audit_action_risk_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE,
  risk_factor_id UUID REFERENCES public.risk_factors(id) ON DELETE CASCADE,
  effectiveness_level TEXT NOT NULL DEFAULT 'medium' CHECK (effectiveness_level IN ('low', 'medium', 'high')),
  response_type TEXT NOT NULL DEFAULT 'substantive' CHECK (response_type IN ('control_test', 'substantive', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_template_id, risk_factor_id)
);

-- Create audit action contexts for situational variations
CREATE TABLE public.audit_action_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE,
  context_name TEXT NOT NULL,
  context_description TEXT,
  modified_procedures TEXT NOT NULL,
  modified_documentation_requirements TEXT,
  estimated_hours_adjustment NUMERIC DEFAULT 0,
  risk_level_adjustment TEXT CHECK (risk_level_adjustment IN ('increase', 'decrease', 'maintain')),
  applicable_conditions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client risk assessments
CREATE TABLE public.client_risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  audit_area_id UUID REFERENCES public.audit_areas(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  assessment_notes TEXT,
  assessed_by UUID REFERENCES auth.users(id),
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, audit_area_id, assessment_date)
);

-- Create audit action recommendations for AI-driven suggestions
CREATE TABLE public.audit_action_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE,
  risk_assessment_id UUID REFERENCES public.client_risk_assessments(id) ON DELETE CASCADE,
  recommendation_score NUMERIC NOT NULL DEFAULT 0.0 CHECK (recommendation_score >= 0 AND recommendation_score <= 1),
  reasoning TEXT,
  ai_metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.audit_action_area_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_action_risk_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_action_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_action_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_action_area_mappings
CREATE POLICY "Area mappings are readable by all authenticated users" 
ON public.audit_action_area_mappings FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage area mappings" 
ON public.audit_action_area_mappings FOR ALL 
USING (auth.uid() IN (
  SELECT p.id FROM profiles p 
  WHERE p.user_role IN ('admin', 'partner', 'manager')
));

-- RLS Policies for audit_action_risk_mappings
CREATE POLICY "Risk mappings are readable by all authenticated users" 
ON public.audit_action_risk_mappings FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage risk mappings" 
ON public.audit_action_risk_mappings FOR ALL 
USING (auth.uid() IN (
  SELECT p.id FROM profiles p 
  WHERE p.user_role IN ('admin', 'partner', 'manager')
));

-- RLS Policies for audit_action_contexts
CREATE POLICY "Action contexts are readable by all authenticated users" 
ON public.audit_action_contexts FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage action contexts" 
ON public.audit_action_contexts FOR ALL 
USING (auth.uid() IN (
  SELECT p.id FROM profiles p 
  WHERE p.user_role IN ('admin', 'partner', 'manager')
));

-- RLS Policies for client_risk_assessments
CREATE POLICY "Users can view risk assessments for accessible clients" 
ON public.client_risk_assessments FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid()) 
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      JOIN team_members tm ON ct.id = tm.team_id 
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  ) OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

CREATE POLICY "Users can manage risk assessments for accessible clients" 
ON public.client_risk_assessments FOR ALL 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid()) 
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      JOIN team_members tm ON ct.id = tm.team_id 
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  ) OR get_user_role(auth.uid()) IN ('admin', 'partner')
) WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid()) 
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      JOIN team_members tm ON ct.id = tm.team_id 
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  ) OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

-- RLS Policies for audit_action_recommendations
CREATE POLICY "Users can view recommendations for accessible clients" 
ON public.audit_action_recommendations FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid()) 
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      JOIN team_members tm ON ct.id = tm.team_id 
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  ) OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

CREATE POLICY "Users can manage recommendations for accessible clients" 
ON public.audit_action_recommendations FOR ALL 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid()) 
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      JOIN team_members tm ON ct.id = tm.team_id 
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  ) OR get_user_role(auth.uid()) IN ('admin', 'partner')
) WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid()) 
    OR c.id IN (
      SELECT ct.client_id FROM client_teams ct 
      JOIN team_members tm ON ct.id = tm.team_id 
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  ) OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

-- Create indexes for better performance
CREATE INDEX idx_audit_action_area_mappings_template ON public.audit_action_area_mappings(action_template_id);
CREATE INDEX idx_audit_action_area_mappings_area ON public.audit_action_area_mappings(audit_area_id);
CREATE INDEX idx_audit_action_risk_mappings_template ON public.audit_action_risk_mappings(action_template_id);
CREATE INDEX idx_audit_action_risk_mappings_risk ON public.audit_action_risk_mappings(risk_factor_id);
CREATE INDEX idx_audit_action_contexts_template ON public.audit_action_contexts(action_template_id);
CREATE INDEX idx_client_risk_assessments_client ON public.client_risk_assessments(client_id);
CREATE INDEX idx_client_risk_assessments_area ON public.client_risk_assessments(audit_area_id);
CREATE INDEX idx_audit_action_recommendations_client ON public.audit_action_recommendations(client_id);
CREATE INDEX idx_audit_action_recommendations_template ON public.audit_action_recommendations(action_template_id);

-- Create triggers for updated_at
CREATE TRIGGER update_audit_action_contexts_updated_at
  BEFORE UPDATE ON public.audit_action_contexts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_risk_assessments_updated_at
  BEFORE UPDATE ON public.client_risk_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_action_recommendations_updated_at
  BEFORE UPDATE ON public.audit_action_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data to connect existing audit actions with areas
INSERT INTO public.audit_action_area_mappings (action_template_id, audit_area_id, relevance_level, sort_order)
SELECT 
  aat.id as action_template_id,
  aa.id as audit_area_id,
  'primary' as relevance_level,
  0 as sort_order
FROM public.audit_action_templates aat
CROSS JOIN public.audit_areas aa
WHERE 
  (aat.subject_area = 'sales' AND aa.audit_number IN (1400, 1500)) OR
  (aat.subject_area = 'payroll' AND aa.audit_number IN (2600, 2650)) OR
  (aat.subject_area = 'operating_expenses' AND aa.audit_number IN (2700, 2800)) OR
  (aat.subject_area = 'inventory' AND aa.audit_number IN (1200, 1300)) OR
  (aat.subject_area = 'finance' AND aa.audit_number IN (2900, 2950)) OR
  (aat.subject_area = 'banking' AND aa.audit_number IN (1900, 1950)) OR
  (aat.subject_area = 'fixed_assets' AND aa.audit_number IN (1000, 1100)) OR
  (aat.subject_area = 'receivables' AND aa.audit_number IN (1500, 1600)) OR
  (aat.subject_area = 'payables' AND aa.audit_number IN (2400, 2500)) OR
  (aat.subject_area = 'equity' AND aa.audit_number IN (2000, 2100))
ON CONFLICT (action_template_id, audit_area_id) DO NOTHING;