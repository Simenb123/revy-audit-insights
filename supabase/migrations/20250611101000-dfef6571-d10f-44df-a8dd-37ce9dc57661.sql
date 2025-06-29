
-- Create enum for audit subject areas
CREATE TYPE public.audit_subject_area AS ENUM (
  'sales',
  'payroll', 
  'operating_expenses',
  'inventory',
  'finance',
  'banking',
  'fixed_assets',
  'receivables',
  'payables',
  'equity',
  'other'
);

-- Create enum for action types
CREATE TYPE public.action_type AS ENUM (
  'analytical',
  'substantive',
  'control_test',
  'inquiry',
  'observation',
  'inspection',
  'recalculation',
  'confirmation'
);

-- Create enum for action status
CREATE TYPE public.action_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'reviewed',
  'approved'
);

-- Create audit action templates table
CREATE TABLE public.audit_action_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_firm_id UUID REFERENCES public.audit_firms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_area audit_subject_area NOT NULL,
  action_type action_type NOT NULL,
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  procedures TEXT NOT NULL,
  documentation_requirements TEXT,
  estimated_hours NUMERIC,
  risk_level TEXT DEFAULT 'medium',
  applicable_phases audit_phase[] DEFAULT ARRAY['execution'::audit_phase]
);

-- Create client audit actions table (instances of templates for specific clients)
CREATE TABLE public.client_audit_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_area audit_subject_area NOT NULL,
  action_type action_type NOT NULL,
  status action_status DEFAULT 'not_started',
  phase audit_phase NOT NULL,
  sort_order INTEGER DEFAULT 0,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  actual_hours NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  procedures TEXT NOT NULL,
  documentation_requirements TEXT,
  estimated_hours NUMERIC,
  risk_level TEXT DEFAULT 'medium',
  findings TEXT,
  conclusion TEXT,
  work_notes TEXT
);

-- Create action groups for organizing related actions
CREATE TABLE public.action_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_firm_id UUID REFERENCES public.audit_firms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_area audit_subject_area NOT NULL,
  is_system_group BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6'
);

-- Link templates to groups
ALTER TABLE public.audit_action_templates 
ADD COLUMN group_id UUID REFERENCES public.action_groups(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_audit_action_templates_firm ON public.audit_action_templates(audit_firm_id);
CREATE INDEX idx_audit_action_templates_subject ON public.audit_action_templates(subject_area);
CREATE INDEX idx_audit_action_templates_type ON public.audit_action_templates(action_type);
CREATE INDEX idx_client_audit_actions_client ON public.client_audit_actions(client_id);
CREATE INDEX idx_client_audit_actions_template ON public.client_audit_actions(template_id);
CREATE INDEX idx_client_audit_actions_subject ON public.client_audit_actions(subject_area);
CREATE INDEX idx_client_audit_actions_status ON public.client_audit_actions(status);
CREATE INDEX idx_client_audit_actions_phase ON public.client_audit_actions(phase);
CREATE INDEX idx_action_groups_firm ON public.action_groups(audit_firm_id);

-- Enable RLS
ALTER TABLE public.audit_action_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_audit_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_action_templates
CREATE POLICY "Users can view templates in their firm" ON public.audit_action_templates
  FOR SELECT USING (
    audit_firm_id = public.get_user_firm(auth.uid()) OR 
    is_system_template = true OR
    audit_firm_id IS NULL
  );

CREATE POLICY "Users can create templates in their firm" ON public.audit_action_templates
  FOR INSERT WITH CHECK (
    audit_firm_id = public.get_user_firm(auth.uid()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Users can update templates in their firm" ON public.audit_action_templates
  FOR UPDATE USING (
    audit_firm_id = public.get_user_firm(auth.uid()) AND
    (created_by = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee'))
  );

-- RLS Policies for client_audit_actions
CREATE POLICY "Users can view client actions for their clients" ON public.client_audit_actions
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.department_id = public.get_user_department(auth.uid()) OR
      c.id IN (
        SELECT ct.client_id FROM public.client_teams ct
        JOIN public.team_members tm ON ct.id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.is_active = true
      )
    ) OR
    public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee')
  );

CREATE POLICY "Users can create client actions for their clients" ON public.client_audit_actions
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.department_id = public.get_user_department(auth.uid()) OR
      c.id IN (
        SELECT ct.client_id FROM public.client_teams ct
        JOIN public.team_members tm ON ct.id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.is_active = true
      )
    )
  );

CREATE POLICY "Users can update client actions for their clients" ON public.client_audit_actions
  FOR UPDATE USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.department_id = public.get_user_department(auth.uid()) OR
      c.id IN (
        SELECT ct.client_id FROM public.client_teams ct
        JOIN public.team_members tm ON ct.id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.is_active = true
      )
    ) OR
    assigned_to = auth.uid()
  );

-- RLS Policies for action_groups
CREATE POLICY "Users can view groups in their firm" ON public.action_groups
  FOR SELECT USING (
    audit_firm_id = public.get_user_firm(auth.uid()) OR 
    is_system_group = true OR
    audit_firm_id IS NULL
  );

CREATE POLICY "Users can create groups in their firm" ON public.action_groups
  FOR INSERT WITH CHECK (
    audit_firm_id = public.get_user_firm(auth.uid()) AND
    created_by = auth.uid()
  );

-- Add triggers for updated_at
CREATE TRIGGER set_audit_action_templates_updated_at BEFORE UPDATE ON public.audit_action_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_client_audit_actions_updated_at BEFORE UPDATE ON public.client_audit_actions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_action_groups_updated_at BEFORE UPDATE ON public.action_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Insert default action groups first
INSERT INTO public.action_groups (name, description, subject_area, is_system_group, color) VALUES
('Revenue Testing', 'Standard revenue audit procedures', 'sales', true, '#10B981'),
('Payroll Procedures', 'Employee compensation audit procedures', 'payroll', true, '#8B5CF6'),
('Cash and Banking', 'Bank and cash audit procedures', 'banking', true, '#3B82F6'),
('Expense Analysis', 'Operating expense audit procedures', 'operating_expenses', true, '#F59E0B'),
('Inventory Procedures', 'Inventory and cost of goods sold procedures', 'inventory', true, '#EF4444');

-- Insert some default system templates with proper casting
INSERT INTO public.audit_action_templates (
  name, description, objective, procedures, subject_area, action_type, is_system_template, applicable_phases
) VALUES 
-- Sales actions
('Analytical Review - Sales', 'Perform analytical procedures on sales revenue', 'Identify unusual fluctuations in sales', 'Compare current year sales with prior year and budget. Investigate variances greater than 10%.', 'sales', 'analytical', true, ARRAY['execution'::audit_phase]),
('Sales Cut-off Testing', 'Test sales cut-off at year-end', 'Ensure sales are recorded in correct period', 'Select sales transactions before and after year-end. Verify shipping documents and dates.', 'sales', 'substantive', true, ARRAY['execution'::audit_phase]),
('Revenue Recognition Review', 'Review revenue recognition policies', 'Ensure compliance with accounting standards', 'Review contracts and assess revenue recognition criteria. Test application of policies.', 'sales', 'substantive', true, ARRAY['planning'::audit_phase, 'execution'::audit_phase]),

-- Payroll actions
('Payroll Analytical Review', 'Analytical procedures for payroll expenses', 'Identify unusual payroll costs', 'Compare payroll expenses with prior year and headcount changes.', 'payroll', 'analytical', true, ARRAY['execution'::audit_phase]),
('Employee Sample Testing', 'Test sample of employees', 'Verify existence and accuracy of payroll', 'Select sample of employees and verify employment records, pay rates, and calculations.', 'payroll', 'substantive', true, ARRAY['execution'::audit_phase]),

-- Banking actions
('Bank Confirmation', 'Confirm bank balances and terms', 'Verify existence and completeness of bank accounts', 'Send confirmation requests to all banks. Follow up on non-responses.', 'banking', 'confirmation', true, ARRAY['execution'::audit_phase]),
('Bank Reconciliation Review', 'Review bank reconciliations', 'Verify accuracy of bank reconciliations', 'Test reconciliations for all material bank accounts. Investigate old outstanding items.', 'banking', 'substantive', true, ARRAY['execution'::audit_phase]);
