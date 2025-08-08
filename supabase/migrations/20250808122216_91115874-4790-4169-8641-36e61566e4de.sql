-- Create formula_definitions table
CREATE TABLE IF NOT EXISTS public.formula_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  formula_expression TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system_formula BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.formula_definitions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_definitions' AND policyname='Formulas are viewable by everyone'
  ) THEN
    CREATE POLICY "Formulas are viewable by everyone"
      ON public.formula_definitions FOR SELECT
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_definitions' AND policyname='Users can create own formulas'
  ) THEN
    CREATE POLICY "Users can create own formulas"
      ON public.formula_definitions FOR INSERT
      WITH CHECK (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_definitions' AND policyname='Users can update own formulas'
  ) THEN
    CREATE POLICY "Users can update own formulas"
      ON public.formula_definitions FOR UPDATE
      USING (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_definitions' AND policyname='Users/admins can delete formulas'
  ) THEN
    CREATE POLICY "Users/admins can delete formulas"
      ON public.formula_definitions FOR DELETE
      USING (created_by = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type,'partner'::user_role_type]));
  END IF;
END$$;

-- Updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='trg_update_formula_definitions_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_formula_definitions_updated_at
    BEFORE UPDATE ON public.formula_definitions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Create formula_variables table
CREATE TABLE IF NOT EXISTS public.formula_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id UUID NOT NULL REFERENCES public.formula_definitions(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  default_value NUMERIC,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_formula_variables_formula_id ON public.formula_variables(formula_id);

ALTER TABLE public.formula_variables ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_variables' AND policyname='Variables are viewable by everyone'
  ) THEN
    CREATE POLICY "Variables are viewable by everyone"
      ON public.formula_variables FOR SELECT
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_variables' AND policyname='Users can create own variables'
  ) THEN
    CREATE POLICY "Users can create own variables"
      ON public.formula_variables FOR INSERT
      WITH CHECK (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_variables' AND policyname='Users can update own variables'
  ) THEN
    CREATE POLICY "Users can update own variables"
      ON public.formula_variables FOR UPDATE
      USING (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_variables' AND policyname='Users/admins can delete variables'
  ) THEN
    CREATE POLICY "Users/admins can delete variables"
      ON public.formula_variables FOR DELETE
      USING (created_by = auth.uid() OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type,'partner'::user_role_type]));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='trg_update_formula_variables_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_formula_variables_updated_at
    BEFORE UPDATE ON public.formula_variables
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Create formula_usage_logs table
CREATE TABLE IF NOT EXISTS public.formula_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  formula_id UUID,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result_value NUMERIC,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.formula_usage_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_usage_logs' AND policyname='Users can insert own usage logs'
  ) THEN
    CREATE POLICY "Users can insert own usage logs"
      ON public.formula_usage_logs FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_usage_logs' AND policyname='Users can view own usage logs'
  ) THEN
    CREATE POLICY "Users can view own usage logs"
      ON public.formula_usage_logs FOR SELECT
      USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='formula_usage_logs' AND policyname='Admins can view all usage logs'
  ) THEN
    CREATE POLICY "Admins can view all usage logs"
      ON public.formula_usage_logs FOR SELECT
      USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type,'partner'::user_role_type,'manager'::user_role_type]));
  END IF;
END$$;

-- Create report_templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  layouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope TEXT NOT NULL DEFAULT 'system', -- 'system' | 'firm' | 'user'
  audit_firm_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_templates_scope_firm ON public.report_templates(scope, audit_firm_id);

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='report_templates' AND policyname='Templates are readable by scope'
  ) THEN
    CREATE POLICY "Templates are readable by scope"
      ON public.report_templates FOR SELECT
      USING (
        scope = 'system' OR
        created_by = auth.uid() OR
        (audit_firm_id IS NOT NULL AND audit_firm_id = get_user_firm(auth.uid()))
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='report_templates' AND policyname='Users can insert templates for their firm or self'
  ) THEN
    CREATE POLICY "Users can insert templates for their firm or self"
      ON public.report_templates FOR INSERT
      WITH CHECK (
        created_by = auth.uid() AND (
          audit_firm_id IS NULL OR audit_firm_id = get_user_firm(auth.uid())
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='report_templates' AND policyname='Users can update own/firm templates'
  ) THEN
    CREATE POLICY "Users can update own/firm templates"
      ON public.report_templates FOR UPDATE
      USING (
        created_by = auth.uid() OR (audit_firm_id IS NOT NULL AND audit_firm_id = get_user_firm(auth.uid()))
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='report_templates' AND policyname='Users can delete own/firm templates'
  ) THEN
    CREATE POLICY "Users can delete own/firm templates"
      ON public.report_templates FOR DELETE
      USING (
        created_by = auth.uid() OR (audit_firm_id IS NOT NULL AND audit_firm_id = get_user_firm(auth.uid()))
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='trg_update_report_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_report_templates_updated_at
    BEFORE UPDATE ON public.report_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;
