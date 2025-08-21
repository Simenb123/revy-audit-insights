-- Final Fix: Remaining functions that need SET search_path = ''

-- Based on common patterns, these are likely the remaining functions
CREATE OR REPLACE FUNCTION public.update_potential_clients_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ai_analysis_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_team_chat_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.chat_rooms (room_type, reference_id, name, description)
  VALUES ('team', NEW.id, NEW.name || ' - Team Chat', 'Automatisk opprettet team-chat for ' || NEW.name);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_duplicate_transactions(p_client_id uuid, p_version_id uuid)
RETURNS TABLE(duplicate_key text, transaction_count integer, transaction_ids uuid[], amount numeric, transaction_date date, description text, account_number text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  WITH duplicate_groups AS (
    SELECT 
      glt.transaction_date::TEXT || '_' || 
      COALESCE(glt.debit_amount, 0)::TEXT || '_' || 
      COALESCE(glt.credit_amount, 0)::TEXT || '_' || 
      COALESCE(glt.description, '') || '_' || 
      COALESCE(coa.account_number, '') as dup_key,
      COUNT(*) as cnt,
      ARRAY_AGG(glt.id) as ids,
      glt.transaction_date,
      COALESCE(glt.debit_amount, glt.credit_amount, 0) as amt,
      glt.description,
      coa.account_number
    FROM public.general_ledger_transactions glt
    INNER JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
    WHERE glt.client_id = p_client_id 
      AND glt.version_id = p_version_id
    GROUP BY 
      glt.transaction_date,
      COALESCE(glt.debit_amount, 0),
      COALESCE(glt.credit_amount, 0),
      glt.description,
      coa.account_number
    HAVING COUNT(*) > 1
  )
  SELECT 
    dg.dup_key,
    dg.cnt::INTEGER,
    dg.ids,
    dg.amt,
    dg.transaction_date,
    dg.description,
    dg.account_number
  FROM duplicate_groups dg
  ORDER BY dg.cnt DESC, dg.amt DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_analysis_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_analysis_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_cache_hit(hash_to_update text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.ai_cache
  SET
    hits = hits + 1,
    last_hit_at = now()
  WHERE request_hash = hash_to_update;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$function$;