-- Fix recursive RLS policies on client_roles table
DROP POLICY IF EXISTS "Users can view their own client roles" ON public.client_roles;
DROP POLICY IF EXISTS "own client roles only" ON public.client_roles;

-- Create simple, non-recursive policies for client_roles
CREATE POLICY "Authenticated users can view client roles" 
ON public.client_roles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert client roles" 
ON public.client_roles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update client roles" 
ON public.client_roles FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete client roles" 
ON public.client_roles FOR DELETE 
USING (auth.role() = 'authenticated');