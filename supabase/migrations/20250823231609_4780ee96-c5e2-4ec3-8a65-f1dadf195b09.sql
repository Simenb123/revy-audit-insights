-- Security Fix Phase 1 (continued): Fix remaining database functions with search_path

-- Fix link_firm_employee_to_profile function 
CREATE OR REPLACE FUNCTION public.link_firm_employee_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  pid uuid;
BEGIN
  IF NEW.email IS NOT NULL THEN
    SELECT p.id INTO pid
    FROM public.profiles p
    WHERE p.audit_firm_id = NEW.audit_firm_id
      AND lower(p.email) = lower(NEW.email)
    LIMIT 1;

    IF pid IS NOT NULL THEN
      NEW.profile_id := pid;
      -- Promoter status fra pre_registered til active automatisk
      IF NEW.status = 'pre_registered' THEN
        NEW.status := 'active';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix claim_audit_firm_by_org function
CREATE OR REPLACE FUNCTION public.claim_audit_firm_by_org(p_org_number text, p_firm_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

-- Fix set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix request_firm_access function
CREATE OR REPLACE FUNCTION public.request_firm_access(p_audit_firm_id uuid, p_role_requested user_role_type DEFAULT 'employee'::user_role_type, p_message text DEFAULT NULL::text, p_email text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

-- Fix set_updated_at_report_builder_settings function
CREATE OR REPLACE FUNCTION public.set_updated_at_report_builder_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Fix cancel_my_firm_access_request function
CREATE OR REPLACE FUNCTION public.cancel_my_firm_access_request(p_request_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

-- Fix set_audit_firm_claim_defaults function
CREATE OR REPLACE FUNCTION public.set_audit_firm_claim_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.claimed_by IS NULL THEN
    NEW.claimed_by := auth.uid();
  END IF;
  IF NEW.claimed_at IS NULL THEN
    NEW.claimed_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix calculate_amount_statistics function
CREATE OR REPLACE FUNCTION public.calculate_amount_statistics(p_client_id uuid, p_version_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_count', COUNT(*),
    'sum', SUM(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'average', AVG(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'min', MIN(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'max', MAX(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)),
    'positive_count', COUNT(*) FILTER (WHERE (COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)) > 0),
    'negative_count', COUNT(*) FILTER (WHERE (COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)) < 0)
  ) INTO result
  FROM public.general_ledger_transactions
  WHERE client_id = p_client_id 
    AND version_id = p_version_id;
  
  RETURN result;
END;
$function$;

-- Fix generate_income_statement function
CREATE OR REPLACE FUNCTION public.generate_income_statement(p_client_id uuid, p_period_start date, p_period_end date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'revenue', revenue_data,
    'expenses', expense_data,
    'net_income', COALESCE(revenue_data->>'total', '0')::NUMERIC - COALESCE(expense_data->>'total', '0')::NUMERIC,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'generated_at', now()
  ) INTO result
  FROM (
    SELECT 
      jsonb_build_object(
        'total', COALESCE(SUM(CASE WHEN coa.account_type = 'revenue' THEN jel.credit_amount - jel.debit_amount ELSE 0 END), 0),
        'accounts', jsonb_agg(
          jsonb_build_object(
            'account_number', coa.account_number,
            'account_name', coa.account_name,
            'amount', SUM(jel.credit_amount - jel.debit_amount)
          ) ORDER BY coa.account_number
        ) FILTER (WHERE coa.account_type = 'revenue')
      ) as revenue_data,
      jsonb_build_object(
        'total', COALESCE(SUM(CASE WHEN coa.account_type = 'expense' THEN jel.debit_amount - jel.credit_amount ELSE 0 END), 0),
        'accounts', jsonb_agg(
          jsonb_build_object(
            'account_number', coa.account_number,
            'account_name', coa.account_name,
            'amount', SUM(jel.debit_amount - jel.credit_amount)
          ) ORDER BY coa.account_number
        ) FILTER (WHERE coa.account_type = 'expense')
      ) as expense_data
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    JOIN public.client_chart_of_accounts coa ON jel.account_id = coa.id
    WHERE je.client_id = p_client_id
      AND je.voucher_date BETWEEN p_period_start AND p_period_end
      AND je.status = 'posted'
      AND coa.account_type IN ('revenue', 'expense')
  ) subquery;
  
  RETURN result;
END;
$function$;