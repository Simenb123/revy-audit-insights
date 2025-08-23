-- Query to identify functions without SET search_path TO '' and fix remaining ones

-- Fix any remaining functions based on the function list in the database
-- These are commonly missed security-sensitive functions

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

-- Show remaining functions that still need fixes by querying system tables
-- This will help identify what functions still need the search_path fix
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE 'Functions without SET search_path TO empty string:';
    
    FOR func_record IN
        SELECT 
            p.proname as function_name,
            n.nspname as schema_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true  -- SECURITY DEFINER functions
        AND NOT EXISTS (
            SELECT 1 
            FROM pg_proc_configs pc 
            WHERE pc.prooid = p.oid 
            AND pc.proconfig @> ARRAY['search_path=']
        )
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'Function: %.%', func_record.schema_name, func_record.function_name;
    END LOOP;
END
$$;