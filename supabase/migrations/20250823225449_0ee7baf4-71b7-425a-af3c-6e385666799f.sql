-- Security Fix Phase 1: Add SET search_path TO '' to remaining database functions

-- Fix cleanup_expired_cache function
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

-- Fix auto_generate_embeddings function
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

-- Fix match_legal_documents function
CREATE OR REPLACE FUNCTION public.match_legal_documents(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, content text, document_number text, summary text, created_date date, last_updated date, is_active boolean, document_type_id uuid, document_type json, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ld.id,
    ld.title,
    ld.content,
    ld.document_number,
    ld.summary,
    ld.created_date,
    ld.last_updated,
    ld.is_active,
    ld.document_type_id,
    json_build_object(
      'id', ldt.id,
      'name', ldt.name,
      'display_name', ldt.display_name,
      'hierarchy_level', ldt.hierarchy_level,
      'authority_weight', ldt.authority_weight
    ) as document_type,
    (1 - (ld.embedding <=> query_embedding))::double precision AS similarity
  FROM public.legal_documents ld
  LEFT JOIN public.legal_document_types ldt ON ld.document_type_id = ldt.id
  WHERE ld.is_active = true 
    AND ld.embedding IS NOT NULL 
    AND (1 - (ld.embedding <=> query_embedding)) > match_threshold
    AND auth.role() = 'authenticated'
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$;

-- Fix match_legal_provisions function
CREATE OR REPLACE FUNCTION public.match_legal_provisions(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, content text, provision_number text, law_identifier text, parent_provision_id uuid, is_active boolean, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    lp.id,
    lp.title,
    lp.content,
    lp.provision_number,
    lp.law_identifier,
    lp.parent_provision_id,
    lp.is_active,
    (1 - (lp.embedding <=> query_embedding))::double precision AS similarity
  FROM public.legal_provisions lp
  WHERE lp.is_active = true 
    AND lp.embedding IS NOT NULL 
    AND (1 - (lp.embedding <=> query_embedding)) > match_threshold
    AND auth.role() = 'authenticated'
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$;

-- Fix link_profile_to_firm_employee function
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

-- Fix match_knowledge_articles function
CREATE OR REPLACE FUNCTION public.match_knowledge_articles(p_query_embedding extensions.vector, p_match_threshold double precision, p_match_count integer)
 RETURNS TABLE(id uuid, title text, slug text, summary text, content text, category_id uuid, status article_status, author_id uuid, view_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, published_at timestamp with time zone, category json, similarity double precision, reference_code text, valid_from date, valid_until date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
    AND auth.role() = 'authenticated'
  ORDER BY similarity DESC
  LIMIT p_match_count;
END;
$function$;

-- Fix process_existing_completed_documents function
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

-- Fix log_client_change function
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

-- Fix update_auditor_history function
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