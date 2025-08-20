-- Fix remaining Security Definer View functions by removing SECURITY DEFINER
-- Focus on view-like functions that return tables

-- 1. Remove SECURITY DEFINER from get_potential_clients_summary (view-like function)
CREATE OR REPLACE FUNCTION public.get_potential_clients_summary(p_auditor_org_number text)
RETURNS TABLE(total_potential integer, new_this_week integer, converted integer, lost integer)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_potential,
    COUNT(CASE WHEN discovered_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::INTEGER as new_this_week,
    COUNT(CASE WHEN status = 'converted' THEN 1 END)::INTEGER as converted,
    COUNT(CASE WHEN status = 'lost' THEN 1 END)::INTEGER as lost
  FROM public.potential_clients 
  WHERE auditor_org_number = p_auditor_org_number
    AND created_by = auth.uid();
END;
$function$;

-- 2. Remove SECURITY DEFINER from get_user_team_ids (view-like function)  
CREATE OR REPLACE FUNCTION public.get_user_team_ids(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$function$;

-- 3. Remove SECURITY DEFINER from get_user_teams (view-like function)
CREATE OR REPLACE FUNCTION public.get_user_teams(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE  
SET search_path TO ''
AS $function$
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$function$;

-- 4. Remove SECURITY DEFINER from process_existing_completed_documents (view-like function)
CREATE OR REPLACE FUNCTION public.process_existing_completed_documents()
RETURNS TABLE(document_id uuid, file_name text, triggered boolean, error_message text)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
DECLARE
    doc_record RECORD;
    trigger_success BOOLEAN;
    error_msg TEXT;
BEGIN
    -- Find completed documents that need AI processing
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
            -- Try to trigger the AI pipeline
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