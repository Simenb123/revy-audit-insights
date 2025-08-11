-- Add monthly allocation support to team_member_allocations
-- 1) Column for month (nullable, 1-12)
ALTER TABLE IF EXISTS public.team_member_allocations
ADD COLUMN IF NOT EXISTS period_month smallint;

-- 2) Safety check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'team_member_allocations_period_month_check'
  ) THEN
    ALTER TABLE public.team_member_allocations
    ADD CONSTRAINT team_member_allocations_period_month_check
    CHECK (
      period_month IS NULL OR (period_month >= 1 AND period_month <= 12)
    );
  END IF;
END $$;

-- 3) Helpful indexes for filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_allocations_team_year_month'
  ) THEN
    CREATE INDEX idx_allocations_team_year_month
    ON public.team_member_allocations (team_id, period_year, period_month);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_allocations_client_year_month'
  ) THEN
    CREATE INDEX idx_allocations_client_year_month
    ON public.team_member_allocations (client_id, period_year, period_month);
  END IF;
END $$;
