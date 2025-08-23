-- Fix remaining database functions missing SET search_path TO '' security protection

-- Fix generate income statement function 
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

-- Fix generate depreciation schedule function
CREATE OR REPLACE FUNCTION public.generate_depreciation_schedule(p_asset_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  asset_record RECORD;
  monthly_depreciation NUMERIC;
  calc_date DATE;
  end_date DATE;
  calc_year INTEGER;
  calc_month INTEGER;
  total_depreciation NUMERIC := 0;
  remaining_value NUMERIC;
  schedule_count INTEGER := 0;
BEGIN
  -- Get asset details
  SELECT * INTO asset_record
  FROM public.fixed_assets
  WHERE id = p_asset_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;
  
  -- Clear existing schedule
  DELETE FROM public.depreciation_schedules WHERE fixed_asset_id = p_asset_id;
  
  -- Calculate monthly depreciation (currently only straight line)
  monthly_depreciation := public.calculate_straight_line_depreciation(
    asset_record.purchase_price,
    asset_record.salvage_value,
    asset_record.useful_life_years
  );
  
  -- Set dates
  calc_date := asset_record.purchase_date;
  end_date := asset_record.purchase_date + INTERVAL '1 year' * asset_record.useful_life_years;
  remaining_value := asset_record.purchase_price;
  
  -- Generate monthly schedule
  WHILE calc_date < end_date LOOP
    calc_year := EXTRACT(YEAR FROM calc_date);
    calc_month := EXTRACT(MONTH FROM calc_date);
    
    total_depreciation := total_depreciation + monthly_depreciation;
    remaining_value := asset_record.purchase_price - total_depreciation;
    
    -- Ensure we don't depreciate below salvage value
    IF remaining_value < asset_record.salvage_value THEN
      monthly_depreciation := monthly_depreciation - (asset_record.salvage_value - remaining_value);
      total_depreciation := asset_record.purchase_price - asset_record.salvage_value;
      remaining_value := asset_record.salvage_value;
    END IF;
    
    INSERT INTO public.depreciation_schedules (
      fixed_asset_id,
      period_year,
      period_month,
      depreciation_amount,
      accumulated_depreciation,
      book_value
    ) VALUES (
      p_asset_id,
      calc_year,
      calc_month,
      monthly_depreciation,
      total_depreciation,
      remaining_value
    );
    
    schedule_count := schedule_count + 1;
    calc_date := calc_date + INTERVAL '1 month';
    
    -- Stop if we've reached salvage value
    IF remaining_value <= asset_record.salvage_value THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN schedule_count;
END;
$function$;

-- Fix increment cache hit function
CREATE OR REPLACE FUNCTION public.increment_cache_hit(hash_to_update text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.ai_cache
  SET
    hits = hits + 1,
    last_hit_at = now()
  WHERE request_hash = hash_to_update;
END;
$function$;

-- Fix generate certificate number function
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$function$;

-- Fix create team chat room function
CREATE OR REPLACE FUNCTION public.create_team_chat_room()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.chat_rooms (room_type, reference_id, name, description)
  VALUES ('team', NEW.id, NEW.name || ' - Team Chat', 'Automatisk opprettet team-chat for ' || NEW.name);
  RETURN NEW;
END;
$function$;

-- Fix update potential clients updated at function
CREATE OR REPLACE FUNCTION public.update_potential_clients_updated_at()
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

-- Fix update ai analysis updated at function  
CREATE OR REPLACE FUNCTION public.update_ai_analysis_updated_at()
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

-- Fix set updated at function (another version)
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

-- Fix set updated at report builder settings function
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