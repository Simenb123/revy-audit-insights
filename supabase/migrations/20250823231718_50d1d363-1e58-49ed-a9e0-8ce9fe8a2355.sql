-- Security Fix Phase 2: Fix remaining functions with missing SET search_path TO ''

-- Fix calculate_budget_totals function
CREATE OR REPLACE FUNCTION public.calculate_budget_totals(p_budget_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.budgets 
  SET 
    total_revenue = (
      SELECT COALESCE(SUM(total_annual_amount), 0) 
      FROM public.budget_lines 
      WHERE budget_id = p_budget_id AND account_type = 'revenue'
    ),
    total_expenses = (
      SELECT COALESCE(SUM(total_annual_amount), 0) 
      FROM public.budget_lines 
      WHERE budget_id = p_budget_id AND account_type = 'expense'
    ),
    updated_at = now()
  WHERE id = p_budget_id;
  
  -- Calculate net income
  UPDATE public.budgets 
  SET net_income = total_revenue - total_expenses
  WHERE id = p_budget_id;
END;
$function$;

-- Fix generate_client_financial_report function
CREATE OR REPLACE FUNCTION public.generate_client_financial_report(p_client_id uuid, p_template_id uuid, p_period_start date, p_period_end date, p_parameters jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  report_id UUID;
  template_record RECORD;
  report_data JSONB := '{}';
BEGIN
  -- Get template information
  SELECT * INTO template_record 
  FROM public.report_templates 
  WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Create the report record
  INSERT INTO public.generated_reports (
    client_id,
    template_id,
    report_name,
    report_period_start,
    report_period_end,
    parameters,
    generated_by,
    report_status
  ) VALUES (
    p_client_id,
    p_template_id,
    template_record.template_name || ' - ' || p_period_start::TEXT || ' to ' || p_period_end::TEXT,
    p_period_start,
    p_period_end,
    p_parameters,
    auth.uid(),
    'generating'
  ) RETURNING id INTO report_id;
  
  -- Generate basic report data based on template type
  CASE template_record.template_type
    WHEN 'balance_sheet' THEN
      report_data := public.generate_balance_sheet(p_client_id, p_period_end);
    WHEN 'income_statement' THEN  
      report_data := public.generate_income_statement(p_client_id, p_period_start, p_period_end);
    ELSE
      report_data := json_build_object(
        'message', 'Report generated successfully',
        'template_type', template_record.template_type,
        'period', json_build_object(
          'start', p_period_start,
          'end', p_period_end
        )
      );
  END CASE;
  
  -- Update the report with generated data
  UPDATE public.generated_reports 
  SET 
    report_data = report_data,
    report_status = 'completed',
    updated_at = now()
  WHERE id = report_id;
  
  RETURN report_id;
END;
$function$;

-- Fix get_budget_summary function
CREATE OR REPLACE FUNCTION public.get_budget_summary(p_client_id uuid, p_budget_year integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_budgets', COUNT(*),
    'active_budgets', COUNT(*) FILTER (WHERE is_active = true),
    'draft_budgets', COUNT(*) FILTER (WHERE status = 'draft'),
    'approved_budgets', COUNT(*) FILTER (WHERE status = 'approved'),
    'total_revenue_budget', COALESCE(SUM(total_revenue) FILTER (WHERE is_active = true), 0),
    'total_expense_budget', COALESCE(SUM(total_expenses) FILTER (WHERE is_active = true), 0),
    'projected_net_income', COALESCE(SUM(net_income) FILTER (WHERE is_active = true), 0)
  ) INTO result
  FROM public.budgets
  WHERE client_id = p_client_id 
    AND budget_year = p_budget_year;
  
  RETURN result;
END;
$function$;

-- Fix get_reports_summary function
CREATE OR REPLACE FUNCTION public.get_reports_summary(p_client_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_reports', COUNT(*),
    'completed_reports', COUNT(*) FILTER (WHERE report_status = 'completed'),
    'draft_reports', COUNT(*) FILTER (WHERE report_status = 'generating'),
    'failed_reports', COUNT(*) FILTER (WHERE report_status = 'failed'),
    'reports_this_month', COUNT(*) FILTER (WHERE generation_date >= date_trunc('month', CURRENT_DATE)),
    'by_template', json_object_agg(
      COALESCE(rt.template_name, 'Unknown'), 
      COUNT(*) ORDER BY rt.template_name
    ) FILTER (WHERE rt.template_name IS NOT NULL)
  ) INTO result
  FROM public.generated_reports gr
  LEFT JOIN public.report_templates rt ON gr.template_id = rt.id
  WHERE gr.client_id = p_client_id;
  
  RETURN result;
END;
$function$;

-- Fix sync_budget_actuals function
CREATE OR REPLACE FUNCTION public.sync_budget_actuals(p_budget_id uuid, p_year integer, p_month integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  synced_count INTEGER := 0;
  line_record RECORD;
  actual_amount NUMERIC(15,2);
BEGIN
  -- Loop through budget lines and calculate actuals
  FOR line_record IN 
    SELECT id, account_number, account_type 
    FROM public.budget_lines 
    WHERE budget_id = p_budget_id
  LOOP
    -- This would typically join with general_ledger_transactions or similar
    -- For now, we'll use a placeholder calculation
    actual_amount := 0;
    
    -- Insert or update budget actuals
    INSERT INTO public.budget_actuals (
      budget_line_id, period_year, period_month, 
      budgeted_amount, actual_amount
    ) VALUES (
      line_record.id, p_year, p_month,
      -- Get budgeted amount for the specific month
      CASE p_month
        WHEN 1 THEN (SELECT jan_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 2 THEN (SELECT feb_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 3 THEN (SELECT mar_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 4 THEN (SELECT apr_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 5 THEN (SELECT may_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 6 THEN (SELECT jun_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 7 THEN (SELECT jul_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 8 THEN (SELECT aug_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 9 THEN (SELECT sep_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 10 THEN (SELECT oct_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 11 THEN (SELECT nov_amount FROM public.budget_lines WHERE id = line_record.id)
        WHEN 12 THEN (SELECT dec_amount FROM public.budget_lines WHERE id = line_record.id)
        ELSE 0
      END,
      actual_amount
    )
    ON CONFLICT (budget_line_id, period_year, period_month)
    DO UPDATE SET 
      actual_amount = EXCLUDED.actual_amount,
      last_updated = now();
    
    synced_count := synced_count + 1;
  END LOOP;
  
  RETURN synced_count;
END;
$function$;