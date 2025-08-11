-- 1) Add initials fields to profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'initials'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN initials text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'initials_color'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN initials_color text;
  END IF;
END$$;

-- 2) Create team_member_allocations table if not exists
CREATE TABLE IF NOT EXISTS public.team_member_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.client_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_year integer NOT NULL,
  budget_hours numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_member_allocations_unique UNIQUE (client_id, team_id, user_id, period_year)
);

-- Enable RLS
ALTER TABLE public.team_member_allocations ENABLE ROW LEVEL SECURITY;

-- 3) Policies for team_member_allocations
DROP POLICY IF EXISTS "View team allocations" ON public.team_member_allocations;
CREATE POLICY "View team allocations"
ON public.team_member_allocations
FOR SELECT
USING (
  (team_id IN (SELECT get_user_team_ids(auth.uid()))) OR
  (get_user_role(auth.uid()) IN ('admin','partner','manager'))
);

DROP POLICY IF EXISTS "Manage team allocations" ON public.team_member_allocations;
CREATE POLICY "Manage team allocations"
ON public.team_member_allocations
FOR ALL
USING (
  (team_id IN (SELECT get_user_team_ids(auth.uid()))) OR
  (get_user_role(auth.uid()) IN ('admin','partner','manager'))
)
WITH CHECK (
  (team_id IN (SELECT get_user_team_ids(auth.uid()))) OR
  (get_user_role(auth.uid()) IN ('admin','partner','manager'))
);

-- 4) Trigger to maintain updated_at
DROP TRIGGER IF EXISTS trg_team_member_allocations_updated_at ON public.team_member_allocations;
CREATE TRIGGER trg_team_member_allocations_updated_at
BEFORE UPDATE ON public.team_member_allocations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_tma_team_year ON public.team_member_allocations (team_id, period_year);
CREATE INDEX IF NOT EXISTS idx_tma_user_year ON public.team_member_allocations (user_id, period_year);
CREATE INDEX IF NOT EXISTS idx_tma_client_team ON public.team_member_allocations (client_id, team_id);

-- 6) Profiles policies to allow admin roles to view and update
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin','partner','manager'));

DROP POLICY IF EXISTS "Admins can update initials" ON public.profiles;
CREATE POLICY "Admins can update initials"
ON public.profiles
FOR UPDATE
USING (get_user_role(auth.uid()) IN ('admin','partner','manager'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin','partner','manager'));
