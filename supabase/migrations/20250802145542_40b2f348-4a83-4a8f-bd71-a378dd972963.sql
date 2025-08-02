-- Add locking functionality to trial_balances table
ALTER TABLE public.trial_balances 
ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT false;

-- Add index for better performance when filtering by lock status
CREATE INDEX idx_trial_balances_is_locked ON public.trial_balances(is_locked);

-- Create function to lock/unlock trial balance versions
CREATE OR REPLACE FUNCTION public.toggle_trial_balance_lock(
  p_client_id UUID,
  p_period_year INTEGER,
  p_is_locked BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update all trial balance entries for the given client and year
  UPDATE public.trial_balances 
  SET is_locked = p_is_locked
  WHERE client_id = p_client_id 
    AND period_year = p_period_year;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Return true if any rows were updated
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policy to prevent modifications to locked trial balances
CREATE POLICY "Prevent modifications to locked trial balances" 
ON public.trial_balances 
FOR UPDATE 
USING (NOT is_locked OR auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'admin'
));

CREATE POLICY "Prevent deletion of locked trial balances" 
ON public.trial_balances 
FOR DELETE 
USING (NOT is_locked OR auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'admin'
));

-- Add comment for documentation
COMMENT ON COLUMN public.trial_balances.is_locked IS 'Prevents modifications to trial balance entries when true. Only admins can modify locked entries.';