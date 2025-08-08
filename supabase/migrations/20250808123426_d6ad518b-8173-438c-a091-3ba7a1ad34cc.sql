-- Ensure report_templates and formula_usage_logs exist with RLS/policies

-- report_templates
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  layouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope TEXT NOT NULL DEFAULT 'system',
  audit_firm_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- formula_usage_logs
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