-- Final attempt: Create ultra-simple RLS policies for client_teams
-- Remove all complex logic that could cause recursion

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view accessible client teams" ON public.client_teams;
DROP POLICY IF EXISTS "Users can manage teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Simple authenticated read for client_teams" ON public.client_teams;
DROP POLICY IF EXISTS "Simple authenticated insert for client_teams" ON public.client_teams;
DROP POLICY IF EXISTS "Simple authenticated update for client_teams" ON public.client_teams;
DROP POLICY IF EXISTS "Simple authenticated delete for client_teams" ON public.client_teams;

-- Create the simplest possible policies - just check if user is authenticated
CREATE POLICY "Allow all authenticated users to read client_teams" 
ON public.client_teams FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert client_teams" 
ON public.client_teams FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update client_teams" 
ON public.client_teams FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to delete client_teams" 
ON public.client_teams FOR DELETE 
USING (auth.role() = 'authenticated');