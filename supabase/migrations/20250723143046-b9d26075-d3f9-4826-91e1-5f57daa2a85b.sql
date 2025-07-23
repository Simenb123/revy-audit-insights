-- Restore simple, working RLS policies for client_teams
-- This ensures BRREG updates work without causing infinite recursion

-- Drop all potentially problematic policies
DROP POLICY IF EXISTS "Allow all authenticated users to read client_teams" ON public.client_teams;
DROP POLICY IF EXISTS "Allow all authenticated users to insert client_teams" ON public.client_teams;
DROP POLICY IF EXISTS "Allow all authenticated users to update client_teams" ON public.client_teams;
DROP POLICY IF EXISTS "Allow all authenticated users to delete client_teams" ON public.client_teams;

-- Create ultra-simple policies that work reliably
CREATE POLICY "client_teams_all_access" 
ON public.client_teams 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Ensure RLS is enabled but with simple rules
ALTER TABLE public.client_teams ENABLE ROW LEVEL SECURITY;