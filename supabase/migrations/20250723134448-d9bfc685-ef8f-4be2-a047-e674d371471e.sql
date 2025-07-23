-- Check and fix potential recursive RLS policies on clients table
-- First, let's see current policies on clients table
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'clients';

-- Drop potentially problematic recursive policies on clients table
DROP POLICY IF EXISTS "Users can view their clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients in their department" ON public.clients;
DROP POLICY IF EXISTS "Users can view accessible clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update accessible clients" ON public.clients;

-- Create simpler, non-recursive policies for clients table
CREATE POLICY "Users can view their own clients" 
ON public.clients FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Department users can view department clients"
ON public.clients FOR SELECT
USING (department_id = get_user_department(auth.uid()));

CREATE POLICY "Users can insert their own clients" 
ON public.clients FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own clients" 
ON public.clients FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Department users can update department clients"
ON public.clients FOR UPDATE
USING (department_id = get_user_department(auth.uid()))
WITH CHECK (department_id = get_user_department(auth.uid()));

-- Check and fix client_roles table policies
DROP POLICY IF EXISTS "Users can view client roles for accessible clients" ON public.client_roles;
DROP POLICY IF EXISTS "System can manage client roles" ON public.client_roles;

CREATE POLICY "Users can view client roles for their clients"
ON public.client_roles FOR SELECT
USING (client_id IN (
  SELECT id FROM public.clients 
  WHERE user_id = auth.uid() OR department_id = get_user_department(auth.uid())
));

CREATE POLICY "System can insert client roles"
ON public.client_roles FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update client roles"
ON public.client_roles FOR UPDATE
USING (true);