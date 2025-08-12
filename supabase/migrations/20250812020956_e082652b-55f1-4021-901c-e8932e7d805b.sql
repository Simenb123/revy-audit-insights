-- Add working paper and autometrics columns to client_audit_actions
ALTER TABLE public.client_audit_actions
  ADD COLUMN IF NOT EXISTS working_paper_template_id uuid,
  ADD COLUMN IF NOT EXISTS working_paper_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_metrics jsonb DEFAULT '{}'::jsonb;

-- Optional helpful comments
COMMENT ON COLUMN public.client_audit_actions.working_paper_template_id IS 'Reference to a working paper template (optional)';
COMMENT ON COLUMN public.client_audit_actions.working_paper_data IS 'Structured working paper content and fields';
COMMENT ON COLUMN public.client_audit_actions.auto_metrics IS 'Automatically computed metrics and statuses';