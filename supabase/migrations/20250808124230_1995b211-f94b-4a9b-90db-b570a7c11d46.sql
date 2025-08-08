-- Align existing report_templates structure to expected schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='report_templates'
  ) THEN
    -- Core columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='title'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN title TEXT NOT NULL DEFAULT 'Template';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='description'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='icon'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN icon TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='widgets'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN widgets JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='layouts'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN layouts JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='scope'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN scope TEXT NOT NULL DEFAULT 'system';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='audit_firm_id'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN audit_firm_id UUID;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='created_by'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN created_by UUID;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='created_at'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='report_templates' AND column_name='updated_at'
    ) THEN
      ALTER TABLE public.report_templates ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
  ELSE
    -- Create table if it does not exist at all
    CREATE TABLE public.report_templates (
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
  END IF;
END$$;

-- Ensure RLS + policies
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