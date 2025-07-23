-- Re-enable RLS on client_teams and fix policies to handle null department_id
ALTER TABLE public.client_teams ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view client teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can view their assigned teams" ON public.client_teams;

-- Create new policies that properly handle null department_id
CREATE POLICY "Users can view accessible client teams" 
ON public.client_teams 
FOR SELECT 
USING (
  -- Allow if user is a team member
  id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR
  -- Allow if user is admin/partner
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
  OR
  -- Allow if department matches (and both are not null)
  (department_id IS NOT NULL 
   AND get_user_department(auth.uid()) IS NOT NULL 
   AND department_id = get_user_department(auth.uid()))
);

CREATE POLICY "Users can manage teams in their department" 
ON public.client_teams 
FOR ALL 
USING (
  -- Allow if user is admin/partner
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
  OR
  -- Allow if department matches (and both are not null)
  (department_id IS NOT NULL 
   AND get_user_department(auth.uid()) IS NOT NULL 
   AND department_id = get_user_department(auth.uid()))
)
WITH CHECK (
  -- Same conditions for insert/update
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
  OR
  (department_id IS NOT NULL 
   AND get_user_department(auth.uid()) IS NOT NULL 
   AND department_id = get_user_department(auth.uid()))
);