-- SECURITY FIX: Fix overly permissive user_profiles table access
-- The user_profiles table currently allows public read access to all user data including emails
-- This is a critical security vulnerability that allows data theft

-- First, drop the dangerous "Profiles are viewable by everyone" policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;

-- Drop any other overly permissive policies on user_profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Create secure policies that follow the same pattern as the main profiles table
-- Users can only view profiles within their own firm or their own profile
CREATE POLICY "Users can view profiles in same firm or own profile"
ON public.user_profiles
FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT p.id 
    FROM public.profiles p 
    WHERE p.audit_firm_id = get_user_firm(auth.uid())
  )
);

-- Admins and partners can view all profiles within their firm
CREATE POLICY "Admins can view all profiles in firm"
ON public.user_profiles
FOR SELECT
USING (
  get_user_role(auth.uid()) IN ('admin', 'partner') 
  AND user_id IN (
    SELECT p.id 
    FROM public.profiles p 
    WHERE p.audit_firm_id = get_user_firm(auth.uid())
  )
);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile only"
ON public.user_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "Users can update own profile only"
ON public.user_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile only"
ON public.user_profiles
FOR DELETE
USING (user_id = auth.uid());

-- Log this security fix
SELECT public.log_security_event(
  'user_profiles_access_restricted',
  'critical',
  'Fixed critical security vulnerability: Removed public read access to user_profiles table',
  jsonb_build_object(
    'table', 'user_profiles',
    'vulnerability', 'public_read_access',
    'fixed_at', now()
  )
);