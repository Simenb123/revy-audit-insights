-- Fix infinite recursion in team_members RLS policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view relevant team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update team members in their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete team members in their teams" ON public.team_members;

-- Ensure the security definer function exists and works correctly
CREATE OR REPLACE FUNCTION public.get_user_team_ids(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  -- Direct query bypassing RLS to avoid recursion
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$function$;

-- Create new policies using the security definer function
CREATE POLICY "Users can view team members in their teams" 
ON public.team_members 
FOR SELECT 
USING (
  team_id IN (SELECT team_id FROM public.get_user_team_ids(auth.uid()))
  OR user_id = auth.uid()
);

CREATE POLICY "Users can insert team members in their teams" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  team_id IN (SELECT team_id FROM public.get_user_team_ids(auth.uid()))
);

CREATE POLICY "Users can update team members in their teams" 
ON public.team_members 
FOR UPDATE 
USING (
  team_id IN (SELECT team_id FROM public.get_user_team_ids(auth.uid()))
);

CREATE POLICY "Users can deactivate team members in their teams" 
ON public.team_members 
FOR UPDATE 
USING (
  team_id IN (SELECT team_id FROM public.get_user_team_ids(auth.uid()))
);