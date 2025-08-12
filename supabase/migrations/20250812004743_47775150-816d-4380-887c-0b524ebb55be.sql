-- Allow creators of an audit firm to insert its first department
-- 1) Trigger to automatically set claimed_by/claimed_at on firm creation
CREATE OR REPLACE FUNCTION public.set_audit_firm_claim_defaults()
RETURNS trigger AS $$
BEGIN
  IF NEW.claimed_by IS NULL THEN
    NEW.claimed_by := auth.uid();
  END IF;
  IF NEW.claimed_at IS NULL THEN
    NEW.claimed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_firms_claim_defaults ON public.audit_firms;
CREATE TRIGGER trg_audit_firms_claim_defaults
BEFORE INSERT ON public.audit_firms
FOR EACH ROW
EXECUTE FUNCTION public.set_audit_firm_claim_defaults();

-- 2) RLS policy: allow inserting departments if the current user has claimed the firm
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'departments'
      AND policyname = 'Users can create department for their claimed firm'
  ) THEN
    CREATE POLICY "Users can create department for their claimed firm"
    ON public.departments
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.audit_firms af
        WHERE af.id = audit_firm_id
          AND af.claimed_by = auth.uid()
      )
    );
  END IF;
END $$;