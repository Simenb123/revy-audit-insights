-- Add optional budgeting and industry columns to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS budget_amount numeric,
  ADD COLUMN IF NOT EXISTS budget_hours numeric,
  ADD COLUMN IF NOT EXISTS actual_industry text;