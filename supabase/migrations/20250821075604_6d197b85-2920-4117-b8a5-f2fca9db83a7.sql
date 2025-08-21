-- Fix remaining functions with mutable search paths

-- Fix all remaining functions that still need secure search paths
CREATE OR REPLACE FUNCTION public.set_materiality_updated_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.link_profile_to_firm_employee()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.copy_global_standards_to_firm(p_audit_firm_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  copied_count INTEGER := 0;
  standard_record RECORD;
BEGIN
  -- Copy all global standard accounts to firm
  FOR standard_record IN 
    SELECT * FROM public.standard_accounts 
    ORDER BY display_order, standard_number
  LOOP
    INSERT INTO public.firm_standard_accounts (
      audit_firm_id,
      base_standard_account_id,
      standard_number,
      standard_name,
      account_type,
      category,
      analysis_group,
      display_order,
      line_type,
      parent_line_id,
      calculation_formula,
      is_total_line,
      sign_multiplier,
      is_active,
      is_custom,
      created_by
    ) VALUES (
      p_audit_firm_id,
      standard_record.id,
      standard_record.standard_number,
      standard_record.standard_name,
      standard_record.account_type,
      standard_record.category,
      standard_record.analysis_group,
      standard_record.display_order,
      standard_record.line_type,
      NULL, -- Will be updated in second pass
      standard_record.calculation_formula,
      standard_record.is_total_line,
      standard_record.sign_multiplier,
      true,
      false,
      auth.uid()
    );
    
    copied_count := copied_count + 1;
  END LOOP;
  
  -- Update parent references for firm accounts
  UPDATE public.firm_standard_accounts fsa1
  SET parent_line_id = fsa2.id
  FROM public.firm_standard_accounts fsa2
  JOIN public.standard_accounts sa1 ON fsa1.base_standard_account_id = sa1.id
  JOIN public.standard_accounts sa2 ON fsa2.base_standard_account_id = sa2.id
  WHERE fsa1.audit_firm_id = p_audit_firm_id
    AND fsa2.audit_firm_id = p_audit_firm_id
    AND sa1.parent_line_id = sa2.id;
  
  RETURN copied_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.copy_global_mapping_rules_to_firm(p_audit_firm_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  copied_count INTEGER := 0;
  rule_record RECORD;
  firm_account_id UUID;
BEGIN
  FOR rule_record IN 
    SELECT amr.*, sa.standard_number 
    FROM public.account_mapping_rules amr
    JOIN public.standard_accounts sa ON amr.standard_account_id = sa.id
    WHERE amr.is_active = true
  LOOP
    -- Find corresponding firm standard account
    SELECT id INTO firm_account_id
    FROM public.firm_standard_accounts
    WHERE audit_firm_id = p_audit_firm_id
      AND standard_number = rule_record.standard_number;
    
    IF firm_account_id IS NOT NULL THEN
      INSERT INTO public.firm_account_mapping_rules (
        audit_firm_id,
        base_rule_id,
        rule_name,
        account_range_start,
        account_range_end,
        firm_standard_account_id,
        confidence_score,
        is_active,
        is_custom,
        created_by
      ) VALUES (
        p_audit_firm_id,
        rule_record.id,
        rule_record.rule_name,
        rule_record.account_range_start,
        rule_record.account_range_end,
        firm_account_id,
        rule_record.confidence_score,
        true,
        false,
        auth.uid()
      );
      
      copied_count := copied_count + 1;
    END IF;
  END LOOP;
  
  RETURN copied_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_active_version(p_version_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  p_client_id UUID;
BEGIN
  -- Get client_id from the version
  SELECT client_id INTO p_client_id 
  FROM public.accounting_data_versions 
  WHERE id = p_version_id;
  
  -- Deactivate all versions for this client
  UPDATE public.accounting_data_versions 
  SET is_active = false, updated_at = now()
  WHERE client_id = p_client_id;
  
  -- Activate the specified version
  UPDATE public.accounting_data_versions 
  SET is_active = true, updated_at = now()
  WHERE id = p_version_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_trial_balance_lock(p_client_id uuid, p_period_year integer, p_is_locked boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

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