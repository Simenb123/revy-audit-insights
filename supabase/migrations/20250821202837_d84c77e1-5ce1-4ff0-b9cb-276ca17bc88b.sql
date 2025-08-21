-- Fix Remaining Function Security Issues
-- Add SET search_path to all remaining functions

-- Fix all remaining functions that don't have SET search_path = ''
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.filtered_data_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_profile_to_firm_employee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.audit_firm_id IS NOT NULL THEN
    UPDATE public.firm_employees fe
    SET profile_id = NEW.id,
        status = CASE WHEN fe.status = 'pre_registered' THEN 'active' ELSE fe.status END,
        updated_at = now()
    WHERE fe.profile_id IS NULL
      AND fe.audit_firm_id = NEW.audit_firm_id
      AND lower(COALESCE(fe.email,'')) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_knowledge_articles(p_query_embedding extensions.vector, p_match_threshold double precision, p_match_count integer)
RETURNS TABLE(id uuid, title text, slug text, summary text, content text, category_id uuid, status article_status, author_id uuid, view_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, published_at timestamp with time zone, category json, similarity double precision, reference_code text, valid_from date, valid_until date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ka.id,
    ka.title,
    ka.slug,
    ka.summary,
    ka.content,
    ka.category_id,
    ka.status,
    ka.author_id,
    ka.view_count,
    ka.created_at,
    ka.updated_at,
    ka.published_at,
    json_build_object('name', kc.name) as category,
    (1 - (ka.embedding <=> p_query_embedding))::double precision AS similarity,
    ka.reference_code,
    ka.valid_from,
    ka.valid_until
  FROM public.knowledge_articles ka
  LEFT JOIN public.knowledge_categories kc ON ka.category_id = kc.id
  WHERE ka.status = 'published' 
    AND ka.embedding IS NOT NULL 
    AND (1 - (ka.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY similarity DESC
  LIMIT p_match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_audit_firm_by_org(p_org_number text, p_firm_name text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.request_firm_access(p_audit_firm_id uuid, p_role_requested user_role_type DEFAULT 'employee'::user_role_type, p_message text DEFAULT NULL::text, p_email text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.approve_firm_access_request(p_request_id uuid, p_assign_role user_role_type DEFAULT 'employee'::user_role_type)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.reject_firm_access_request(p_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cancel_my_firm_access_request(p_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;