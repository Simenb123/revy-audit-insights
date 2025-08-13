-- Create function to fetch firm-wide trial balance entries with RLS-safe SECURITY DEFINER
-- This enables org-level analysis without exposing data outside the user's firm

CREATE OR REPLACE FUNCTION public.get_firm_trial_balance_entries(p_fiscal_year integer DEFAULT NULL)
RETURNS SETOF public.trial_balance_entries
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT t.*
  FROM public.trial_balance_entries t
  JOIN public.clients c ON c.id = t.client_id
  WHERE c.audit_firm_id = public.get_user_firm(auth.uid())
    AND (p_fiscal_year IS NULL OR t.period_year = p_fiscal_year);
$$;

-- Ensure function is callable by authenticated users
REVOKE ALL ON FUNCTION public.get_firm_trial_balance_entries(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_firm_trial_balance_entries(integer) TO authenticated;
