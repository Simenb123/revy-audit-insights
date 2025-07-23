-- Temporarily disable RLS on client_teams to test BRREG updates
-- This is a diagnostic test to confirm the source of recursion

ALTER TABLE public.client_teams DISABLE ROW LEVEL SECURITY;