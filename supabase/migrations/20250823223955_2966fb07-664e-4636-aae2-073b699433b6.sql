-- Security fixes for database functions - add SET search_path TO '' to functions missing this protection

-- Fix account mapping functions
CREATE OR REPLACE FUNCTION public.populate_account_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Get account details from client_chart_of_accounts if not already set
  IF NEW.account_number IS NULL OR NEW.account_name IS NULL THEN
    SELECT account_number, account_name 
    INTO NEW.account_number, NEW.account_name
    FROM public.client_chart_of_accounts 
    WHERE id = NEW.client_account_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

CREATE OR REPLACE FUNCTION public.calculate_straight_line_depreciation(p_purchase_price numeric, p_salvage_value numeric, p_useful_life_years integer)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF p_useful_life_years <= 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (p_purchase_price - p_salvage_value) / p_useful_life_years / 12;
END;
$function$;

-- Fix auto-generation function for embeddings
CREATE OR REPLACE FUNCTION public.auto_generate_embeddings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only process if the article is published and doesn't already have embeddings
  IF NEW.status = 'published' AND (NEW.embedding IS NULL OR OLD.embedding IS NULL) THEN
    -- Call the generate-embeddings function asynchronously
    PERFORM net.http_post(
      url := 'https://fxelhfwaoizqyecikscu.supabase.co/functions/v1/generate-embeddings',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc"}'::jsonb,
      body := json_build_object('article_id', NEW.id)::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix process existing completed documents function
CREATE OR REPLACE FUNCTION public.process_existing_completed_documents()
 RETURNS TABLE(document_id uuid, file_name text, triggered boolean, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    doc_record RECORD;
    trigger_success BOOLEAN;
    error_msg TEXT;
BEGIN
    -- Find completed documents that need AI processing
    -- This function needs SECURITY DEFINER to make HTTP requests
    FOR doc_record IN 
        SELECT cdf.id, cdf.file_name, cdf.extracted_text
        FROM public.client_documents_files cdf 
        WHERE cdf.text_extraction_status = 'completed'
          AND (cdf.ai_analysis_summary IS NULL OR cdf.ai_suggested_category IS NULL)
          AND cdf.extracted_text IS NOT NULL 
          AND LENGTH(TRIM(cdf.extracted_text)) > 10
        ORDER BY cdf.created_at DESC
        LIMIT 20  -- Process max 20 at a time to avoid timeouts
    LOOP
        BEGIN
            -- Try to trigger the AI pipeline (requires elevated permissions)
            PERFORM net.http_post(
                url := 'https://fxelhfwaoizqyecikscu.supabase.co/functions/v1/document-ai-pipeline',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc"}'::jsonb,
                body := json_build_object(
                    'documentId', doc_record.id,
                    'triggerSource', 'manual_batch_processing'
                )::jsonb
            );
            
            trigger_success := TRUE;
            error_msg := NULL;
            
        EXCEPTION WHEN OTHERS THEN
            trigger_success := FALSE;
            error_msg := SQLERRM;
        END;
        
        RETURN QUERY SELECT doc_record.id, doc_record.file_name, trigger_success, error_msg;
        
        -- Small delay between triggers
        PERFORM pg_sleep(1);
    END LOOP;
END;
$function$;

-- Fix client change logging function
CREATE OR REPLACE FUNCTION public.log_client_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Log CEO changes
  IF OLD.ceo IS DISTINCT FROM NEW.ceo THEN
    INSERT INTO public.client_history_logs (
      client_id, change_type, field_name, old_value, new_value, 
      change_source, description, change_metadata
    ) VALUES (
      NEW.id, 'role_change', 'ceo', OLD.ceo, NEW.ceo,
      'brreg_sync', 'CEO endret fra BRREG oppdatering',
      jsonb_build_object('sync_timestamp', now())
    );
  END IF;

  -- Log Chair changes
  IF OLD.chair IS DISTINCT FROM NEW.chair THEN
    INSERT INTO public.client_history_logs (
      client_id, change_type, field_name, old_value, new_value, 
      change_source, description, change_metadata
    ) VALUES (
      NEW.id, 'role_change', 'chair', OLD.chair, NEW.chair,
      'brreg_sync', 'Styreleder endret fra BRREG oppdatering',
      jsonb_build_object('sync_timestamp', now())
    );
  END IF;

  -- Log auditor changes
  IF OLD.current_auditor_org_number IS DISTINCT FROM NEW.current_auditor_org_number THEN
    INSERT INTO public.client_history_logs (
      client_id, change_type, field_name, old_value, new_value, 
      change_source, description, change_metadata
    ) VALUES (
      NEW.id, 'auditor_change', 'current_auditor_org_number', 
      OLD.current_auditor_org_number, NEW.current_auditor_org_number,
      'brreg_sync', 'Revisor endret fra BRREG oppdatering',
      jsonb_build_object('sync_timestamp', now())
    );
  END IF;

  -- Update sync timestamp
  NEW.last_brreg_sync_at = now();
  NEW.brreg_sync_version = COALESCE(NEW.brreg_sync_version, 0) + 1;

  RETURN NEW;
END;
$function$;

-- Fix auditor history update function
CREATE OR REPLACE FUNCTION public.update_auditor_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Mark previous auditor as not current
  UPDATE public.client_auditor_history 
  SET is_current = false, valid_to = CURRENT_DATE
  WHERE client_id = NEW.id AND is_current = true;

  -- Insert new auditor record if auditor changed
  IF OLD.current_auditor_org_number IS DISTINCT FROM NEW.current_auditor_org_number 
     AND NEW.current_auditor_org_number IS NOT NULL THEN
    INSERT INTO public.client_auditor_history (
      client_id, auditor_org_number, auditor_name, valid_from, 
      is_current, discovered_via
    ) VALUES (
      NEW.id, NEW.current_auditor_org_number, NEW.current_auditor_name, 
      COALESCE(NEW.auditor_since, CURRENT_DATE), true, 'brreg_sync'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix materiality updated fields function
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

-- Fix firm employee profile linking function
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

-- Add authentication requirements to legal data tables
-- Update RLS policies for legal_provisions to require authentication
DROP POLICY IF EXISTS "Legal provisions are viewable by everyone" ON public.legal_provisions;
CREATE POLICY "Legal provisions require authentication" 
ON public.legal_provisions 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update RLS policies for legal_citations to require authentication  
DROP POLICY IF EXISTS "Legal citations are viewable by everyone" ON public.legal_citations;
CREATE POLICY "Legal citations require authentication" 
ON public.legal_citations 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update RLS policies for legal_documents to require authentication
DROP POLICY IF EXISTS "Legal documents are viewable by everyone" ON public.legal_documents;
CREATE POLICY "Legal documents require authentication" 
ON public.legal_documents 
FOR SELECT 
USING (auth.role() = 'authenticated');