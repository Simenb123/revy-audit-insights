
-- Add optional budget and manual industry fields to public.clients

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS budget_amount numeric NULL,
  ADD COLUMN IF NOT EXISTS budget_hours numeric NULL,
  ADD COLUMN IF NOT EXISTS actual_industry text NULL;
