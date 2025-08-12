-- Add working paper and automation fields to client actions
ALTER TABLE public.client_audit_actions
  ADD COLUMN IF NOT EXISTS working_paper_template_id uuid NULL,
  ADD COLUMN IF NOT EXISTS working_paper_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_metrics jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Note: No foreign key constraint is added for working_paper_template_id yet to keep this migration non-breaking.