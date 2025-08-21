-- Final security hardening - fix remaining function search paths

-- Fix remaining functions that still need secure search paths
CREATE OR REPLACE FUNCTION public.trigger_document_ai_processing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only trigger if status changed to 'completed' and we have extracted text
  IF NEW.text_extraction_status = 'completed' 
     AND OLD.text_extraction_status != 'completed'
     AND NEW.extracted_text IS NOT NULL 
     AND LENGTH(TRIM(NEW.extracted_text)) > 10 THEN
    
    -- Log the trigger activation
    RAISE LOG 'Document AI pipeline triggered for document: % (%)', NEW.id, NEW.file_name;
    
    -- Call the document AI pipeline function asynchronously
    -- This will process both analysis and categorization
    PERFORM net.http_post(
      url := 'https://fxelhfwaoizqyecikscu.supabase.co/functions/v1/document-ai-pipeline',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc"}'::jsonb,
      body := json_build_object(
        'documentId', NEW.id,
        'triggerSource', 'database_trigger'
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.get_next_voucher_number(p_client_id uuid, p_year integer, p_month integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  next_number INTEGER;
  voucher_text TEXT;
BEGIN
  -- Get and increment the voucher number
  INSERT INTO public.voucher_sequences (client_id, year, month, last_voucher_number)
  VALUES (p_client_id, p_year, p_month, 1)
  ON CONFLICT (client_id, year, month)
  DO UPDATE SET 
    last_voucher_number = voucher_sequences.last_voucher_number + 1,
    updated_at = now()
  RETURNING last_voucher_number INTO next_number;
  
  -- Format as YYYY-MM-NNNN
  voucher_text := p_year::TEXT || '-' || LPAD(p_month::TEXT, 2, '0') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN voucher_text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_journal_entry_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  total_debit NUMERIC(15,2);
  total_credit NUMERIC(15,2);
  entry_total NUMERIC(15,2);
BEGIN
  -- Calculate totals for the journal entry
  SELECT 
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM public.journal_entry_lines
  WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  -- Check if debit equals credit
  IF total_debit != total_credit THEN
    RAISE EXCEPTION 'Journal entry is not balanced: Debit = %, Credit = %', total_debit, total_credit;
  END IF;
  
  -- Update the total amount on journal entry
  UPDATE public.journal_entries
  SET total_amount = total_debit,
      updated_at = now()
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.fix_norwegian_encoding_safe()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result JSONB := '{}';
  clients_updated INTEGER := 0;
  transactions_updated INTEGER := 0;
  accounts_updated INTEGER := 0;
BEGIN
  -- Fix clients table - only where we have clear encoding corruption patterns
  UPDATE public.clients
  SET name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å'),
    ceo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    ceo, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å'),
    chair = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    chair, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å'),
    current_auditor_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    current_auditor_name, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å')
  WHERE name ~ 'Ã[¦¸¥†˜…]' OR ceo ~ 'Ã[¦¸¥†˜…]' OR chair ~ 'Ã[¦¸¥†˜…]' OR current_auditor_name ~ 'Ã[¦¸¥†˜…]';
  
  GET DIAGNOSTICS clients_updated = ROW_COUNT;
  
  -- Fix general ledger transactions
  UPDATE public.general_ledger_transactions
  SET description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å')
  WHERE description ~ 'Ã[¦¸¥†˜…]';
  
  GET DIAGNOSTICS transactions_updated = ROW_COUNT;
  
  -- Fix chart of accounts
  UPDATE public.client_chart_of_accounts
  SET account_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    account_name, 'Ã¦', 'æ'), 'Ã¸', 'ø'), 'Ã¥', 'å'), 'Ã†', 'Æ'), 'Ã˜', 'Ø'), 'Ã…', 'Å')
  WHERE account_name ~ 'Ã[¦¸¥†˜…]';
  
  GET DIAGNOSTICS accounts_updated = ROW_COUNT;
  
  -- Return results
  result := jsonb_build_object(
    'clients_updated', clients_updated,
    'transactions_updated', transactions_updated,
    'accounts_updated', accounts_updated,
    'total_updated', clients_updated + transactions_updated + accounts_updated,
    'timestamp', now()
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_account_distribution(p_client_id uuid, p_version_id uuid)
 RETURNS TABLE(account_number text, account_name text, transaction_count integer, total_amount numeric)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    coa.account_number,
    coa.account_name,
    COUNT(*)::INTEGER as transaction_count,
    SUM(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0)) as total_amount
  FROM public.general_ledger_transactions glt
  INNER JOIN public.client_chart_of_accounts coa ON glt.client_account_id = coa.id
  WHERE glt.client_id = p_client_id 
    AND glt.version_id = p_version_id
  GROUP BY coa.account_number, coa.account_name
  ORDER BY transaction_count DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_monthly_summary(p_client_id uuid, p_version_id uuid)
 RETURNS TABLE(month text, transaction_count integer, total_amount numeric)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(glt.transaction_date, 'YYYY-MM') as month,
    COUNT(*)::INTEGER as transaction_count,
    SUM(COALESCE(glt.debit_amount, 0) - COALESCE(glt.credit_amount, 0)) as total_amount
  FROM public.general_ledger_transactions glt
  WHERE glt.client_id = p_client_id 
    AND glt.version_id = p_version_id
  GROUP BY TO_CHAR(glt.transaction_date, 'YYYY-MM')
  ORDER BY month;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.get_basic_transaction_info(p_client_id uuid, p_version_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_transactions', COUNT(*),
    'date_range', json_build_object(
      'start', MIN(transaction_date),
      'end', MAX(transaction_date)
    ),
    'unique_accounts', COUNT(DISTINCT client_account_id),
    'unique_vouchers', COUNT(DISTINCT voucher_number) FILTER (WHERE voucher_number IS NOT NULL),
    'total_debit', SUM(COALESCE(debit_amount, 0)),
    'total_credit', SUM(COALESCE(credit_amount, 0))
  ) INTO result
  FROM public.general_ledger_transactions
  WHERE client_id = p_client_id 
    AND version_id = p_version_id;
  
  RETURN result;
END;
$function$;