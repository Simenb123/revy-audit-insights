-- Create tables for formula definitions, variables, usage logs, and report templates
-- 1) formula_definitions
CREATE TABLE IF NOT EXISTS public.formula_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  formula_expression TEXT, -- string expression like "10+15" or "(3-4)*100"
  category TEXT,
  is_system_formula BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2) formula_variables
CREATE TABLE IF NOT EXISTS public.formula_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  variable_type TEXT NOT NULL, -- 'account_reference' | 'constant' | 'calculated'
  value_expression TEXT,       -- string expression if calculated or reference key
  data_type TEXT NOT NULL,     -- 'numeric' | 'percentage' | 'currency'
  category TEXT,
  is_system_variable BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 3) formula_usage_logs
CREATE TABLE IF NOT EXISTS public.formula_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id UUID,
  account_id UUID,
  client_id UUID,
  usage_context TEXT NOT NULL,
  execution_time_ms INTEGER,
  result_value NUMERIC,
  input_values JSONB,
  session_id TEXT,
  metadata JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) report_templates
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  layouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  audit_firm_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.formula_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Policies for formula_definitions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_definitions' AND policyname = 'Formulas are readable (system or owner)'
  ) THEN
    CREATE POLICY "Formulas are readable (system or owner)"
    ON public.formula_definitions
    FOR SELECT
    USING (is_system_formula = true OR created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_definitions' AND policyname = 'Users can insert their own formulas'
  ) THEN
    CREATE POLICY "Users can insert their own formulas"
    ON public.formula_definitions
    FOR INSERT
    WITH CHECK (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_definitions' AND policyname = 'Users can update their own formulas'
  ) THEN
    CREATE POLICY "Users can update their own formulas"
    ON public.formula_definitions
    FOR UPDATE
    USING (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_definitions' AND policyname = 'Users can delete their own formulas'
  ) THEN
    CREATE POLICY "Users can delete their own formulas"
    ON public.formula_definitions
    FOR DELETE
    USING (created_by = auth.uid());
  END IF;
END $$;

-- Policies for formula_variables
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_variables' AND policyname = 'Variables are readable (system or owner)'
  ) THEN
    CREATE POLICY "Variables are readable (system or owner)"
    ON public.formula_variables
    FOR SELECT
    USING (is_system_variable = true OR created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_variables' AND policyname = 'Users can insert their own variables'
  ) THEN
    CREATE POLICY "Users can insert their own variables"
    ON public.formula_variables
    FOR INSERT
    WITH CHECK (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_variables' AND policyname = 'Users can update their own variables'
  ) THEN
    CREATE POLICY "Users can update their own variables"
    ON public.formula_variables
    FOR UPDATE
    USING (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_variables' AND policyname = 'Users can delete their own variables'
  ) THEN
    CREATE POLICY "Users can delete their own variables"
    ON public.formula_variables
    FOR DELETE
    USING (created_by = auth.uid());
  END IF;
END $$;

-- Policies for formula_usage_logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_usage_logs' AND policyname = 'Users can insert own usage logs'
  ) THEN
    CREATE POLICY "Users can insert own usage logs"
    ON public.formula_usage_logs
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'formula_usage_logs' AND policyname = 'Users can view own usage logs or admins'
  ) THEN
    CREATE POLICY "Users can view own usage logs or admins"
    ON public.formula_usage_logs
    FOR SELECT
    USING (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.user_role = 'admin'
      )
    );
  END IF;
END $$;

-- Policies for report_templates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'report_templates' AND policyname = 'Templates are readable (system, firm, or owner)'
  ) THEN
    CREATE POLICY "Templates are readable (system, firm, or owner)"
    ON public.report_templates
    FOR SELECT
    USING (
      is_system_template = true
      OR created_by = auth.uid()
      OR audit_firm_id = public.get_user_firm(auth.uid())
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'report_templates' AND policyname = 'Users can insert their own templates'
  ) THEN
    CREATE POLICY "Users can insert their own templates"
    ON public.report_templates
    FOR INSERT
    WITH CHECK (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'report_templates' AND policyname = 'Users/admins can update templates'
  ) THEN
    CREATE POLICY "Users/admins can update templates"
    ON public.report_templates
    FOR UPDATE
    USING (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.user_role IN ('admin','partner','manager')
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'report_templates' AND policyname = 'Users/admins can delete templates'
  ) THEN
    CREATE POLICY "Users/admins can delete templates"
    ON public.report_templates
    FOR DELETE
    USING (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.user_role IN ('admin','partner','manager')
      )
    );
  END IF;
END $$;

-- Triggers to auto-update updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_formula_definitions_updated_at'
  ) THEN
    CREATE TRIGGER trg_formula_definitions_updated_at
    BEFORE UPDATE ON public.formula_definitions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_formula_variables_updated_at'
  ) THEN
    CREATE TRIGGER trg_formula_variables_updated_at
    BEFORE UPDATE ON public.formula_variables
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_report_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_report_templates_updated_at
    BEFORE UPDATE ON public.report_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;