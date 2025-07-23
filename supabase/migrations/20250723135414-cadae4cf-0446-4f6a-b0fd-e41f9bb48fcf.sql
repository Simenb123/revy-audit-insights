-- Check existing policies on client_teams table
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'client_teams';

-- Drop any potentially recursive policies on client_teams
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.client_teams;
DROP POLICY IF EXISTS "Users can view teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can manage teams they belong to" ON public.client_teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.client_teams;
DROP POLICY IF EXISTS "Department users can view department teams" ON public.client_teams;
DROP POLICY IF EXISTS "Team members can update their teams" ON public.client_teams;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.client_teams;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.client_teams;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.client_teams;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.client_teams;

-- Create completely simple, non-recursive policies for client_teams
CREATE POLICY "Simple authenticated read for client_teams" 
ON public.client_teams FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Simple authenticated insert for client_teams" 
ON public.client_teams FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Simple authenticated update for client_teams" 
ON public.client_teams FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Simple authenticated delete for client_teams" 
ON public.client_teams FOR DELETE 
USING (auth.role() = 'authenticated');