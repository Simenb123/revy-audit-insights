-- Phase 5: Audit Documentation and Reporting Tables (Fixed)

-- Only create tables that don't already exist

-- Generated reports
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  template_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  generation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_status TEXT NOT NULL DEFAULT 'generating' CHECK (report_status IN ('generating', 'completed', 'failed', 'archived')),
  report_data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  file_path TEXT,
  file_size BIGINT,
  parameters JSONB DEFAULT '{}',
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
CREATE TABLE IF NOT EXISTS public.report_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL,
  section_name TEXT NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN ('header', 'summary', 'table', 'chart', 'text', 'calculation', 'footer', 'signature')),
  display_order INTEGER NOT NULL DEFAULT 0,
  section_config JSONB NOT NULL DEFAULT '{}',
  data_source TEXT,
  is_required BOOLEAN DEFAULT true,
  conditional_logic JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit working papers
CREATE TABLE IF NOT EXISTS public.audit_working_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  paper_reference TEXT NOT NULL,
  paper_title TEXT NOT NULL,
  audit_area TEXT,
  paper_type TEXT NOT NULL CHECK (paper_type IN ('lead_schedule', 'detail_testing', 'analytical_review', 'walkthrough', 'control_testing', 'substantive_testing', 'summary', 'memo')),
  paper_status TEXT NOT NULL DEFAULT 'draft' CHECK (paper_status IN ('draft', 'in_review', 'completed', 'archived')),
  period_year INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  cross_references JSONB DEFAULT '[]',
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
CREATE TABLE IF NOT EXISTS public.documentation_checklists (
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
  checklist_data JSONB NOT NULL DEFAULT '[]',
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
CREATE TABLE IF NOT EXISTS public.report_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generated_report_id UUID NOT NULL,
  approval_level INTEGER NOT NULL,
  approver_role TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_required')),
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  changes_requested TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'generated_reports_template_id_fkey') THEN
    ALTER TABLE public.generated_reports 
    ADD CONSTRAINT generated_reports_template_id_fkey 
    FOREIGN KEY (template_id) REFERENCES public.report_templates(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'report_sections_template_id_fkey') THEN
    ALTER TABLE public.report_sections 
    ADD CONSTRAINT report_sections_template_id_fkey 
    FOREIGN KEY (template_id) REFERENCES public.report_templates(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'report_approvals_generated_report_id_fkey') THEN
    ALTER TABLE public.report_approvals 
    ADD CONSTRAINT report_approvals_generated_report_id_fkey 
    FOREIGN KEY (generated_report_id) REFERENCES public.generated_reports(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_generated_reports_client_period ON public.generated_reports(client_id, report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON public.generated_reports(report_status);
CREATE INDEX IF NOT EXISTS idx_report_sections_template ON public.report_sections(template_id, display_order);
CREATE INDEX IF NOT EXISTS idx_audit_working_papers_client_year ON public.audit_working_papers(client_id, period_year);
CREATE INDEX IF NOT EXISTS idx_audit_working_papers_status ON public.audit_working_papers(paper_status);
CREATE INDEX IF NOT EXISTS idx_documentation_checklists_client ON public.documentation_checklists(client_id, audit_year);
CREATE INDEX IF NOT EXISTS idx_report_approvals_report ON public.report_approvals(generated_report_id, approval_level);

-- Enable RLS on new tables
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_working_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Generated Reports Policies
DROP POLICY IF EXISTS "Users can manage reports for their clients" ON public.generated_reports;
CREATE POLICY "Users can manage reports for their clients" 
ON public.generated_reports FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Report Sections Policies
DROP POLICY IF EXISTS "Users can manage sections for accessible templates" ON public.report_sections;
CREATE POLICY "Users can manage sections for accessible templates" 
ON public.report_sections FOR ALL 
USING (template_id IN (
  SELECT id FROM public.report_templates 
  WHERE is_system_template = true OR audit_firm_id IS NULL
));

-- Audit Working Papers Policies
DROP POLICY IF EXISTS "Users can manage working papers for their clients" ON public.audit_working_papers;
CREATE POLICY "Users can manage working papers for their clients" 
ON public.audit_working_papers FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Documentation Checklists Policies
DROP POLICY IF EXISTS "Users can manage checklists for their clients" ON public.documentation_checklists;
CREATE POLICY "Users can manage checklists for their clients" 
ON public.documentation_checklists FOR ALL 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Report Approvals Policies
DROP POLICY IF EXISTS "Users can view approvals for their reports" ON public.report_approvals;
CREATE POLICY "Users can view approvals for their reports" 
ON public.report_approvals FOR SELECT 
USING (generated_report_id IN (
  SELECT id FROM public.generated_reports 
  WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
));

DROP POLICY IF EXISTS "Assigned approvers can update approvals" ON public.report_approvals;
CREATE POLICY "Assigned approvers can update approvals" 
ON public.report_approvals FOR UPDATE 
USING (assigned_to = auth.uid());

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_generated_reports_updated_at ON public.generated_reports;
CREATE TRIGGER update_generated_reports_updated_at
  BEFORE UPDATE ON public.generated_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_sections_updated_at ON public.report_sections;
CREATE TRIGGER update_report_sections_updated_at
  BEFORE UPDATE ON public.report_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_audit_working_papers_updated_at ON public.audit_working_papers;
CREATE TRIGGER update_audit_working_papers_updated_at
  BEFORE UPDATE ON public.audit_working_papers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_documentation_checklists_updated_at ON public.documentation_checklists;
CREATE TRIGGER update_documentation_checklists_updated_at
  BEFORE UPDATE ON public.documentation_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_approvals_updated_at ON public.report_approvals;
CREATE TRIGGER update_report_approvals_updated_at
  BEFORE UPDATE ON public.report_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing template structure to existing report_templates if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'report_templates' AND column_name = 'template_structure') THEN
    ALTER TABLE public.report_templates ADD COLUMN template_structure JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'report_templates' AND column_name = 'is_system_template') THEN
    ALTER TABLE public.report_templates ADD COLUMN is_system_template BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'report_templates' AND column_name = 'audit_firm_id') THEN
    ALTER TABLE public.report_templates ADD COLUMN audit_firm_id UUID;
  END IF;
END $$;

-- Functions for report management
CREATE OR REPLACE FUNCTION public.get_reports_summary(p_client_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_reports', COUNT(*),
    'completed_reports', COUNT(*) FILTER (WHERE report_status = 'completed'),
    'draft_reports', COUNT(*) FILTER (WHERE report_status = 'generating'),
    'failed_reports', COUNT(*) FILTER (WHERE report_status = 'failed'),
    'reports_this_month', COUNT(*) FILTER (WHERE generation_date >= date_trunc('month', CURRENT_DATE)),
    'by_template', json_object_agg(
      COALESCE(rt.template_name, 'Unknown'), 
      COUNT(*) ORDER BY rt.template_name
    ) FILTER (WHERE rt.template_name IS NOT NULL)
  ) INTO result
  FROM public.generated_reports gr
  LEFT JOIN public.report_templates rt ON gr.template_id = rt.id
  WHERE gr.client_id = p_client_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate basic financial reports using existing functions
CREATE OR REPLACE FUNCTION public.generate_client_financial_report(
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
      report_data := json_build_object(
        'message', 'Report generated successfully',
        'template_type', template_record.template_type,
        'period', json_build_object(
          'start', p_period_start,
          'end', p_period_end
        )
      );
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
  completed_count INTEGER := 0;
  total_count INTEGER := 0;
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
    completed_items = COALESCE(completed_count, 0),
    total_items = COALESCE(total_count, 0),
    status = CASE 
      WHEN COALESCE(completed_count, 0) = COALESCE(total_count, 0) AND total_count > 0 THEN 'completed'
      WHEN COALESCE(completed_count, 0) > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    completed_date = CASE 
      WHEN COALESCE(completed_count, 0) = COALESCE(total_count, 0) AND total_count > 0 THEN COALESCE(completed_date, CURRENT_DATE)
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_checklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;