
-- 1) Claim-felter på audit_firms
ALTER TABLE public.audit_firms
  ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_audit_firms_org_number ON public.audit_firms(org_number);

-- 2) Superadmin-tabell + helper-funksjon
CREATE TABLE IF NOT EXISTS public.app_super_admins (
  user_id uuid PRIMARY KEY,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_super_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.app_super_admins a WHERE a.user_id = user_uuid
  );
$$;

-- RLS for superadmin-tabellen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_super_admins' AND policyname = 'Superadmins can read'
  ) THEN
    CREATE POLICY "Superadmins can read"
      ON public.app_super_admins
      FOR SELECT
      USING (public.is_super_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_super_admins' AND policyname = 'Superadmins can modify'
  ) THEN
    CREATE POLICY "Superadmins can modify"
      ON public.app_super_admins
      FOR ALL
      USING (public.is_super_admin(auth.uid()))
      WITH CHECK (public.is_super_admin(auth.uid()));
  END IF;

  -- Valgfri bootstrap-policy: tillat første rad å bli lagt til når tabellen er tom
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_super_admins' AND policyname = 'Bootstrap first superadmin'
  ) THEN
    CREATE POLICY "Bootstrap first superadmin"
      ON public.app_super_admins
      FOR INSERT
      WITH CHECK ((SELECT COUNT(*) = 0 FROM public.app_super_admins));
  END IF;
END$$;

-- 3) Enum for forespørselsstatus
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_request_status') THEN
    CREATE TYPE public.access_request_status AS ENUM ('pending','approved','rejected','cancelled');
  END IF;
END$$;

-- 4) Tabell for tilgangsforespørsler
CREATE TABLE IF NOT EXISTS public.firm_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_firm_id uuid NOT NULL REFERENCES public.audit_firms(id) ON DELETE CASCADE,
  requester_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text,
  role_requested user_role_type NOT NULL DEFAULT 'employee',
  message text,
  status access_request_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_request
ON public.firm_access_requests(audit_firm_id, requester_profile_id)
WHERE status = 'pending';

ALTER TABLE public.firm_access_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Forespørrer kan opprette og se egne forespørsler
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='firm_access_requests' AND policyname='Requester can insert own'
  ) THEN
    CREATE POLICY "Requester can insert own"
      ON public.firm_access_requests
      FOR INSERT
      WITH CHECK (requester_profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='firm_access_requests' AND policyname='Requester can view own'
  ) THEN
    CREATE POLICY "Requester can view own"
      ON public.firm_access_requests
      FOR SELECT
      USING (requester_profile_id = auth.uid());
  END IF;

  -- RLS: Firmaledelse (admin/partner/manager) og superadmin kan se/oppdatere forespørsler for firmaet
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='firm_access_requests' AND policyname='Firm admins can view'
  ) THEN
    CREATE POLICY "Firm admins can view"
      ON public.firm_access_requests
      FOR SELECT
      USING (
        (
          audit_firm_id = public.get_user_firm(auth.uid())
          AND public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type,'partner'::user_role_type,'manager'::user_role_type])
        ) OR public.is_super_admin(auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='firm_access_requests' AND policyname='Firm admins can update'
  ) THEN
    CREATE POLICY "Firm admins can update"
      ON public.firm_access_requests
      FOR UPDATE
      USING (
        (
          audit_firm_id = public.get_user_firm(auth.uid())
          AND public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type,'partner'::user_role_type,'manager'::user_role_type])
        ) OR public.is_super_admin(auth.uid())
      )
      WITH CHECK (
        (
          audit_firm_id = public.get_user_firm(auth.uid())
          AND public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type,'partner'::user_role_type,'manager'::user_role_type])
        ) OR public.is_super_admin(auth.uid())
      );
  END IF;

  -- RLS: Forespørrer kan slette/avbryte egen pending forespørsel
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='firm_access_requests' AND policyname='Requester can delete own pending'
  ) THEN
    CREATE POLICY "Requester can delete own pending"
      ON public.firm_access_requests
      FOR DELETE
      USING (requester_profile_id = auth.uid() AND status = 'pending');
  END IF;
END$$;

-- Oppdater updated_at
CREATE TRIGGER set_firm_access_requests_updated_at
BEFORE UPDATE ON public.firm_access_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Funksjon: Claim firma med org.nr (oppretter hvis mangler)
CREATE OR REPLACE FUNCTION public.claim_audit_firm_by_org(p_org_number text, p_firm_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  firm_id uuid;
  existing_claimant uuid;
  prof RECORD;
  updated_rows integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = uid;
  IF prof IS NULL THEN
    RAISE EXCEPTION 'Profile not found for current user';
  END IF;

  -- Finn eller opprett firma
  SELECT id, claimed_by INTO firm_id, existing_claimant
  FROM public.audit_firms
  WHERE org_number = p_org_number
  LIMIT 1;

  IF firm_id IS NULL THEN
    INSERT INTO public.audit_firms (name, org_number)
    VALUES (COALESCE(p_firm_name, 'Ukjent firma'), p_org_number)
    RETURNING id INTO firm_id;
    existing_claimant := NULL;
  END IF;

  -- Sjekk om allerede claimet
  IF existing_claimant IS NOT NULL THEN
    RAISE EXCEPTION 'Firm is already claimed';
  END IF;

  -- Marker claim
  UPDATE public.audit_firms
  SET claimed_by = uid, claimed_at = now()
  WHERE id = firm_id;

  -- Koble bruker til firma som admin
  UPDATE public.profiles
  SET audit_firm_id = firm_id,
      user_role = 'admin'
  WHERE id = uid;

  -- Oppdater evt. eksisterende forhåndsregistrering eller opprett ny i firm_employees
  UPDATE public.firm_employees
  SET profile_id = uid,
      first_name = COALESCE(first_name, prof.first_name),
      last_name = COALESCE(last_name, prof.last_name),
      email = COALESCE(email, prof.email),
      role = 'admin',
      status = 'active',
      updated_at = now()
  WHERE audit_firm_id = firm_id
    AND (profile_id = uid OR (email IS NOT NULL AND prof.email IS NOT NULL AND lower(email) = lower(prof.email)));

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    INSERT INTO public.firm_employees (
      audit_firm_id, department_id, profile_id, email,
      first_name, last_name, role, status
    ) VALUES (
      firm_id, NULL, uid, prof.email,
      COALESCE(prof.first_name, ''), COALESCE(prof.last_name, ''), 'admin', 'active'
    );
  END IF;

  RETURN firm_id;
END;
$$;

-- 6) Funksjon: Opprett tilgangsforespørsel
CREATE OR REPLACE FUNCTION public.request_firm_access(p_audit_firm_id uuid, p_role_requested user_role_type DEFAULT 'employee', p_message text DEFAULT NULL, p_email text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  req_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Finn eksisterende pending forespørsel
  SELECT id INTO req_id
  FROM public.firm_access_requests
  WHERE audit_firm_id = p_audit_firm_id
    AND requester_profile_id = uid
    AND status = 'pending'
  LIMIT 1;

  IF req_id IS NOT NULL THEN
    RETURN req_id;
  END IF;

  INSERT INTO public.firm_access_requests (
    audit_firm_id, requester_profile_id, email, role_requested, message, status
  ) VALUES (
    p_audit_firm_id, uid, p_email, p_role_requested, p_message, 'pending'
  )
  RETURNING id INTO req_id;

  RETURN req_id;
END;
$$;

-- 7) Funksjon: Godkjenn tilgangsforespørsel
CREATE OR REPLACE FUNCTION public.approve_firm_access_request(p_request_id uuid, p_assign_role user_role_type DEFAULT 'employee')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  r RECORD;
  prof RECORD;
  updated_rows integer;
  permitted boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM public.firm_access_requests WHERE id = p_request_id;
  IF r IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Tilgangskontroll: superadmin ELLER firmaets admin/partner/manager
  permitted := public.is_super_admin(uid) OR (
    public.get_user_firm(uid) = r.audit_firm_id AND
    public.get_user_role(uid) = ANY (ARRAY['admin'::user_role_type,'partner'::user_role_type,'manager'::user_role_type])
  );

  IF NOT permitted THEN
    RAISE EXCEPTION 'Not permitted to approve requests for this firm';
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = r.requester_profile_id;

  -- Sett approved
  UPDATE public.firm_access_requests
  SET status = 'approved',
      decided_by = uid,
      decided_at = now()
  WHERE id = p_request_id;

  -- Koble profil til firma + rolle
  UPDATE public.profiles
  SET audit_firm_id = r.audit_firm_id,
      user_role = p_assign_role
  WHERE id = r.requester_profile_id;

  -- Oppdater eller opprett firm_employee
  UPDATE public.firm_employees
  SET profile_id = r.requester_profile_id,
      first_name = COALESCE(first_name, prof.first_name),
      last_name = COALESCE(last_name, prof.last_name),
      email = COALESCE(email, prof.email),
      role = p_assign_role,
      status = 'active',
      updated_at = now()
  WHERE audit_firm_id = r.audit_firm_id
    AND (profile_id = r.requester_profile_id OR (email IS NOT NULL AND prof.email IS NOT NULL AND lower(email) = lower(prof.email)));

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    INSERT INTO public.firm_employees (
      audit_firm_id, department_id, profile_id, email,
      first_name, last_name, role, status
    ) VALUES (
      r.audit_firm_id, NULL, r.requester_profile_id, prof.email,
      COALESCE(prof.first_name, ''), COALESCE(prof.last_name, ''), p_assign_role, 'active'
    );
  END IF;

  RETURN true;
END;
$$;

-- 8) Funksjon: Avslå tilgangsforespørsel
CREATE OR REPLACE FUNCTION public.reject_firm_access_request(p_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  r RECORD;
  permitted boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM public.firm_access_requests WHERE id = p_request_id;
  IF r IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  permitted := public.is_super_admin(uid) OR (
    public.get_user_firm(uid) = r.audit_firm_id AND
    public.get_user_role(uid) = ANY (ARRAY['admin'::user_role_type,'partner'::user_role_type,'manager'::user_role_type])
  );

  IF NOT permitted THEN
    RAISE EXCEPTION 'Not permitted to reject requests for this firm';
  END IF;

  UPDATE public.firm_access_requests
  SET status = 'rejected',
      decided_by = uid,
      decided_at = now()
  WHERE id = p_request_id;

  RETURN true;
END;
$$;

-- 9) Funksjon: Kanseller egen forespørsel
CREATE OR REPLACE FUNCTION public.cancel_my_firm_access_request(p_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  r RECORD;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM public.firm_access_requests WHERE id = p_request_id;
  IF r IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF r.requester_profile_id <> uid THEN
    RAISE EXCEPTION 'Not permitted to cancel this request';
  END IF;

  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending requests can be cancelled';
  END IF;

  UPDATE public.firm_access_requests
  SET status = 'cancelled',
      decided_by = uid,
      decided_at = now()
  WHERE id = p_request_id;

  RETURN true;
END;
$$;
