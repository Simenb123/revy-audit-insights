-- Harden function by setting immutable search_path
CREATE OR REPLACE FUNCTION public.set_audit_firm_claim_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.claimed_by IS NULL THEN
    NEW.claimed_by := auth.uid();
  END IF;
  IF NEW.claimed_at IS NULL THEN
    NEW.claimed_at := now();
  END IF;
  RETURN NEW;
END;
$$;