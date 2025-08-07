-- Fix the batch processing function to avoid column name ambiguity
CREATE OR REPLACE FUNCTION public.process_existing_completed_documents()
RETURNS TABLE(document_id uuid, file_name text, triggered boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;