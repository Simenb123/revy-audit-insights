
-- Drop the existing policy and create a more permissive one for INSERT
DROP POLICY IF EXISTS "Users can insert their own firms" ON public.audit_firms;

-- Create a simple policy that allows authenticated users to insert audit firms
CREATE POLICY "Authenticated users can insert audit firms" ON public.audit_firms
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Also ensure we have a SELECT policy
DROP POLICY IF EXISTS "Users can view their own firm" ON public.audit_firms;
CREATE POLICY "Users can view their own firm" ON public.audit_firms
  FOR SELECT 
  TO authenticated
  USING (id = public.get_user_firm(auth.uid()) OR public.get_user_firm(auth.uid()) IS NULL);
