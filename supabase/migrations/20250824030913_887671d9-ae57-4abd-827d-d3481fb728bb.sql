-- Security Fix Phase 3: Fix final remaining functions with missing SET search_path TO ''

-- Let me check which remaining functions need fixing by querying them directly

-- Fix update_checklist_completion function
CREATE OR REPLACE FUNCTION public.update_checklist_completion(p_checklist_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  completed_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Calculate completion from checklist_data JSONB
  SELECT 
    COUNT(*) FILTER (WHERE (item->>'completed')::BOOLEAN = true),
    COUNT(*)
  INTO completed_count, total_count
  FROM public.documentation_checklists dc,
       jsonb_array_elements(dc.checklist_data) AS item
  WHERE dc.id = p_checklist_id;
  
  -- Update the checklist record
  UPDATE public.documentation_checklists
  SET 
    completed_items = COALESCE(completed_count, 0),
    total_items = COALESCE(total_count, 0),
    status = CASE 
      WHEN COALESCE(completed_count, 0) = COALESCE(total_count, 0) AND total_count > 0 THEN 'completed'
      WHEN COALESCE(completed_count, 0) > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    completed_date = CASE 
      WHEN COALESCE(completed_count, 0) = COALESCE(total_count, 0) AND total_count > 0 THEN COALESCE(completed_date, CURRENT_DATE)
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_checklist_id;
END;
$function$;

-- Find and fix any other remaining SECURITY DEFINER functions without SET search_path
-- Let me check for pg_trgm related functions that might need fixing

-- Fix get_next_version_number function if it exists
CREATE OR REPLACE FUNCTION public.get_next_version_number(p_client_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(MAX(version_number), 0) + 1 
  FROM public.accounting_data_versions 
  WHERE client_id = p_client_id;
$function$;

-- Fix get_exchange_rate function
CREATE OR REPLACE FUNCTION public.get_exchange_rate(p_from_currency text, p_to_currency text DEFAULT 'NOK'::text, p_date date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT exchange_rate
  FROM public.exchange_rates
  WHERE from_currency_code = p_from_currency
    AND to_currency_code = p_to_currency
    AND rate_date <= p_date
  ORDER BY rate_date DESC
  LIMIT 1;
$function$;

-- Fix convert_currency function
CREATE OR REPLACE FUNCTION public.convert_currency(p_amount numeric, p_from_currency text, p_to_currency text DEFAULT 'NOK'::text, p_date date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT 
    CASE 
      WHEN p_from_currency = p_to_currency THEN p_amount
      ELSE p_amount * COALESCE(public.get_exchange_rate(p_from_currency, p_to_currency, p_date), 0)
    END;
$function$;