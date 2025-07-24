-- Add RLS policies for standard_accounts table

-- Enable RLS if not already enabled
ALTER TABLE public.standard_accounts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all standard accounts
CREATE POLICY "Users can view all standard accounts" 
ON public.standard_accounts 
FOR SELECT 
USING (true);

-- Allow admins and managers to insert standard accounts
CREATE POLICY "Admins can insert standard accounts" 
ON public.standard_accounts 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE user_role IN ('admin', 'partner', 'manager')
  )
);

-- Allow admins and managers to update standard accounts
CREATE POLICY "Admins can update standard accounts" 
ON public.standard_accounts 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE user_role IN ('admin', 'partner', 'manager')
  )
);

-- Allow admins and managers to delete standard accounts
CREATE POLICY "Admins can delete standard accounts" 
ON public.standard_accounts 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE user_role IN ('admin', 'partner', 'manager')
  )
);