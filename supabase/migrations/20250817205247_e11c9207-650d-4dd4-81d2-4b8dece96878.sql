-- Phase 5: Audit Documentation and Reporting Tables

-- Report templates for standardized reports
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_category TEXT NOT NULL CHECK (template_category IN ('financial', 'audit', 'tax', 'compliance', 'analytical', 'custom')),
  template_type TEXT NOT NULL CHECK (template_type IN ('balance_sheet', 'income_statement', 'cash_flow', 'trial_balance', 'audit_report', 'management_letter', 'variance_analysis', 'ratio_analysis', 'custom')),
  description TEXT,
  template_structure JSONB NOT NULL DEFAULT '{}', -- JSON structure defining the report layout
  data_requirements JSONB DEFAULT '[]', -- Required data sources and parameters
  calculation_formulas JSONB DEFAULT '{}', -- Calculation logic for computed fields
  formatting_rules JSONB DEFAULT '{}', -- Styling and formatting preferences
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  audit_firm_id UUID, -- NULL for system templates, specific firm for custom templates
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  version_number INTEGER DEFAULT 1,
  UNIQUE(template_name, audit_firm_id, version_number)
);

-- Generated reports
CREATE TABLE public.generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.report_templates(id),
  report_name TEXT NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  generation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_status TEXT NOT NULL DEFAULT 'generating' CHECK (report_status IN ('generating', 'completed', 'failed', 'archived')),
  report_data JSONB NOT NULL DEFAULT '{}', -- The actual report content
  metadata JSONB DEFAULT '{}', -- Additional metadata like data sources used
  file_path TEXT, -- Path to generated PDF/Excel file if applicable
  file_size BIGINT,
  parameters JSONB DEFAULT '{}', -- Parameters used for generation
  error_message TEXT,
  generated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  review_date TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  is_final BOOLEAN DEFAULT false,
  export_format TEXT DEFAULT 'pdf' CHECK (export_format IN ('pdf', 'excel', 'json', 'html')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Report sections for modular report building
CREATE TABLE public.report_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN ('header', 'summary', 'table', 'chart', 'text', 'calculation', 'footer', 'signature')),
  display_order INTEGER NOT NULL DEFAULT 0,
  section_config JSONB NOT NULL DEFAULT '{}', -- Configuration for this section
  data_source TEXT, -- SQL query, function name, or data source identifier
  is_required BOOLEAN DEFAULT true,
  conditional_logic JSONB DEFAULT '{}', -- Conditions for when to include this section
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit working papers
CREATE TABLE public.audit_working_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  paper_reference TEXT NOT NULL, -- e.g., "A1.1", "B2.3"
  paper_title TEXT NOT NULL,
  audit_area TEXT, -- e.g., "Revenue", "Expenses", "Assets"
  paper_type TEXT NOT NULL CHECK (paper_type IN ('lead_schedule', 'detail_testing', 'analytical_review', 'walkthrough', 'control_testing', 'substantive_testing', 'summary', 'memo')),
  paper_status TEXT NOT NULL DEFAULT 'draft' CHECK (paper_status IN ('draft', 'in_review', 'completed', 'archived')),
  period_year INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}', -- Main working paper content
  attachments JSONB DEFAULT '[]', -- References to attached documents
  cross_references JSONB DEFAULT '[]', -- References to other working papers
  conclusion TEXT,
  reviewer_notes TEXT,
  prepared_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  preparation_date DATE,
  review_date DATE,
  estimated_hours NUMERIC(5,2),
  actual_hours NUMERIC(5,2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  materiality_threshold NUMERIC(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, paper_reference, period_year)
);

-- Documentation checklists
CREATE TABLE public.documentation_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  checklist_name TEXT NOT NULL,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('audit_completion', 'file_review', 'quality_control', 'tax_compliance', 'year_end', 'interim')),
  audit_year INTEGER NOT NULL,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  completion_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_items = 0 THEN 0
      ELSE ROUND((completed_items::NUMERIC / total_items::NUMERIC) * 100, 2)
    END
  ) STORED,
  checklist_data JSONB NOT NULL DEFAULT '[]', -- Array of checklist items
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Report approval workflow
CREATE TABLE public.report_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generated_report_id UUID NOT NULL REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  approval_level INTEGER NOT NULL, -- 1 = Manager, 2 = Partner, etc.
  approver_role TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_required')),
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  changes_requested TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_report_templates_category_type ON public.report_templates(template_category, template_type);
CREATE INDEX idx_report_templates_firm ON public.report_templates(audit_firm_id) WHERE audit_firm_id IS NOT NULL;
CREATE INDEX idx_generated_reports_client_period ON public.generated_reports(client_id, report_period_start, report_period_end);
CREATE INDEX idx_generated_reports_status ON public.generated_reports(report_status);
CREATE INDEX idx_report_sections_template ON public.report_sections(template_id, display_order);
CREATE INDEX idx_audit_working_papers_client_year ON public.audit_working_papers(client_id, period_year);
CREATE INDEX idx_audit_working_papers_status ON public.audit_working_papers(paper_status);
CREATE INDEX idx_documentation_checklists_client ON public.documentation_checklists(client_id, audit_year);
CREATE INDEX idx_report_approvals_report ON public.report_approvals(generated_report_id, approval_level);

-- RLS Policies
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_working_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_approvals ENABLE ROW LEVEL SECURITY;

-- Report Templates Policies
CREATE POLICY "System templates are viewable by everyone" 
ON public.report_templates FOR SELECT 
USING (is_system_template = true OR audit_firm_id IS NULL);

CREATE POLICY "Users can view their firm's templates" 
ON public.report_templates FOR SELECT 
USING (audit_firm_id IN (
  SELECT audit_firm_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create templates for their firm" 
ON public.report_templates FOR INSERT 
WITH CHECK (audit_firm_id IN (
  SELECT audit_firm_id FROM profiles WHERE id = auth.uid()
) AND created_by = auth.uid());

CREATE POLICY "Users can update their firm's templates" 
ON public.report_templates FOR UPDATE 
USING (audit_firm_id IN (
  SELECT audit_firm_id FROM profiles WHERE id = auth.uid()
));

-- Generated Reports Policies
CREATE POLICY "Users can manage reports for their clients" 
ON public.generated_reports FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Report Sections Policies
CREATE POLICY "Users can manage sections for accessible templates" 
ON public.report_sections FOR ALL 
USING (template_id IN (
  SELECT id FROM public.report_templates 
  WHERE is_system_template = true 
    OR audit_firm_id IS NULL 
    OR audit_firm_id IN (SELECT audit_firm_id FROM profiles WHERE id = auth.uid())
));

-- Audit Working Papers Policies
CREATE POLICY "Users can manage working papers for their clients" 
ON public.audit_working_papers FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Documentation Checklists Policies
CREATE POLICY "Users can manage checklists for their clients" 
ON public.documentation_checklists FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Report Approvals Policies
CREATE POLICY "Users can view approvals for their reports" 
ON public.report_approvals FOR SELECT 
USING (generated_report_id IN (
  SELECT id FROM public.generated_reports 
  WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
));

CREATE POLICY "Assigned approvers can update approvals" 
ON public.report_approvals FOR UPDATE 
USING (assigned_to = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_reports_updated_at
  BEFORE UPDATE ON public.generated_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_sections_updated_at
  BEFORE UPDATE ON public.report_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_working_papers_updated_at
  BEFORE UPDATE ON public.audit_working_papers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentation_checklists_updated_at
  BEFORE UPDATE ON public.documentation_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_approvals_updated_at
  BEFORE UPDATE ON public.report_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for report management
CREATE OR REPLACE FUNCTION public.get_report_templates_summary(p_audit_firm_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_templates', COUNT(*),
    'system_templates', COUNT(*) FILTER (WHERE is_system_template = true),
    'custom_templates', COUNT(*) FILTER (WHERE is_system_template = false),
    'active_templates', COUNT(*) FILTER (WHERE is_active = true),
    'by_category', json_object_agg(
      template_category, 
      COUNT(*) ORDER BY template_category
    ) FILTER (WHERE template_category IS NOT NULL)
  ) INTO result
  FROM public.report_templates
  WHERE (p_audit_firm_id IS NULL) 
    OR (is_system_template = true) 
    OR (audit_firm_id = p_audit_firm_id);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate basic financial reports
CREATE OR REPLACE FUNCTION public.generate_financial_report(
  p_client_id UUID, 
  p_template_id UUID, 
  p_period_start DATE, 
  p_period_end DATE,
  p_parameters JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  template_record RECORD;
  report_data JSONB := '{}';
BEGIN
  -- Get template information
  SELECT * INTO template_record 
  FROM public.report_templates 
  WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Create the report record
  INSERT INTO public.generated_reports (
    client_id,
    template_id,
    report_name,
    report_period_start,
    report_period_end,
    parameters,
    generated_by,
    report_status
  ) VALUES (
    p_client_id,
    p_template_id,
    template_record.template_name || ' - ' || p_period_start::TEXT || ' to ' || p_period_end::TEXT,
    p_period_start,
    p_period_end,
    p_parameters,
    auth.uid(),
    'generating'
  ) RETURNING id INTO report_id;
  
  -- Generate basic report data based on template type
  CASE template_record.template_type
    WHEN 'balance_sheet' THEN
      report_data := public.generate_balance_sheet(p_client_id, p_period_end);
    WHEN 'income_statement' THEN  
      report_data := public.generate_income_statement(p_client_id, p_period_start, p_period_end);
    ELSE
      report_data := '{"message": "Report generation not implemented for this template type"}';
  END CASE;
  
  -- Update the report with generated data
  UPDATE public.generated_reports 
  SET 
    report_data = report_data,
    report_status = 'completed',
    updated_at = now()
  WHERE id = report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update checklist completion
CREATE OR REPLACE FUNCTION public.update_checklist_completion(p_checklist_id UUID)
RETURNS VOID AS $$
DECLARE
  completed_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Calculate completion from checklist_data JSONB
  SELECT 
    COUNT(*) FILTER (WHERE (item->>'completed')::BOOLEAN = true),
    COUNT(*)
  INTO completed_count, total_count
  FROM public.documentation_checklists dc,
       jsonb_array_elements(dc.checklist_data) AS item
  WHERE dc.id = p_checklist_id;
  
  -- Update the checklist record
  UPDATE public.documentation_checklists
  SET 
    completed_items = completed_count,
    total_items = total_count,
    status = CASE 
      WHEN completed_count = total_count THEN 'completed'
      WHEN completed_count > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    completed_date = CASE 
      WHEN completed_count = total_count THEN COALESCE(completed_date, CURRENT_DATE)
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_checklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default system templates
INSERT INTO public.report_templates (
  template_name, template_category, template_type, description, 
  template_structure, is_system_template, is_active
) VALUES 
(
  'Standard Balance Sheet',
  'financial',
  'balance_sheet',
  'Standard balance sheet report with assets, liabilities and equity',
  '{"sections": ["assets", "liabilities", "equity"], "format": "standard"}',
  true,
  true
),
(
  'Standard Income Statement', 
  'financial',
  'income_statement',
  'Standard income statement with revenue and expenses',
  '{"sections": ["revenue", "expenses", "net_income"], "format": "standard"}',
  true,
  true
),
(
  'Trial Balance Report',
  'financial', 
  'trial_balance',
  'Detailed trial balance with all accounts',
  '{"sections": ["accounts"], "format": "detailed", "show_balances": true}',
  true,
  true
),
(
  'Basic Audit Report',
  'audit',
  'audit_report', 
  'Standard audit opinion letter template',
  '{"sections": ["opinion", "basis", "responsibilities", "signature"], "format": "letter"}',
  true,
  true
),
(
  'Management Letter',
  'audit',
  'management_letter',
  'Management letter for internal control recommendations',
  '{"sections": ["executive_summary", "findings", "recommendations"], "format": "letter"}',
  true,
  true
);