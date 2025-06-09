
-- Fix RLS policies for audit_firms table
CREATE POLICY "Users can insert their own firms" ON public.audit_firms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own firm" ON public.audit_firms
  FOR UPDATE USING (id = public.get_user_firm(auth.uid()));

-- Also need to fix the policies that reference functions that might not exist yet
-- Let's make sure the insert policy for profiles allows updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
