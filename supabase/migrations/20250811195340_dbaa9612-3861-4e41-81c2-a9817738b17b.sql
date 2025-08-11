-- Enable RLS on profiles (no-op if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read basic profile rows within same firm or own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Profiles: same-firm or self can select'
  ) THEN
    CREATE POLICY "Profiles: same-firm or self can select"
    ON public.profiles
    FOR SELECT
    USING (audit_firm_id = get_user_firm(auth.uid()) OR id = auth.uid());
  END IF;
END$$;

-- Add unique constraint to prevent duplicate monthly allocations for a user/client/team/year/month
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'team_member_allocations_unique_period'
  ) THEN
    ALTER TABLE public.team_member_allocations
    ADD CONSTRAINT team_member_allocations_unique_period
    UNIQUE (team_id, client_id, user_id, period_year, period_month);
  END IF;
END$$;

-- Helpful covering index for planner queries
CREATE INDEX IF NOT EXISTS idx_tma_team_period 
  ON public.team_member_allocations(team_id, period_year, period_month);
