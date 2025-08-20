-- Add missing user_id field to audit_sampling_plans table
-- This is an additive migration to support user ownership of sampling plans

ALTER TABLE public.audit_sampling_plans 
ADD COLUMN IF NOT EXISTS user_id uuid;

COMMENT ON COLUMN public.audit_sampling_plans.user_id IS 'Owner of the sampling plan (set by application on insert)';

-- Update RLS policy to use both client ownership and user ownership
DROP POLICY IF EXISTS "Users can manage sampling plans for their clients" ON public.audit_sampling_plans;

CREATE POLICY "Users can manage sampling plans for their clients and own plans" 
ON public.audit_sampling_plans 
FOR ALL 
USING (
  client_id IN (
    SELECT clients.id 
    FROM clients 
    WHERE clients.user_id = auth.uid()
  ) 
  OR user_id = auth.uid()
)
WITH CHECK (
  client_id IN (
    SELECT clients.id 
    FROM clients 
    WHERE clients.user_id = auth.uid()
  ) 
  OR user_id = auth.uid()
);