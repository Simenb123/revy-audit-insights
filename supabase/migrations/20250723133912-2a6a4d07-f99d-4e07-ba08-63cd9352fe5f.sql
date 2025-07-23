-- Drop all existing policies on client_teams to start fresh
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.client_teams;
DROP POLICY IF EXISTS "Users can view teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can manage teams they belong to" ON public.client_teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.client_teams;
DROP POLICY IF EXISTS "Department users can view department teams" ON public.client_teams;
DROP POLICY IF EXISTS "Team members can update their teams" ON public.client_teams;

-- Simple, non-recursive policies for client_teams
CREATE POLICY "Enable read access for authenticated users" 
ON public.client_teams FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" 
ON public.client_teams FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" 
ON public.client_teams FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" 
ON public.client_teams FOR DELETE 
USING (auth.role() = 'authenticated');