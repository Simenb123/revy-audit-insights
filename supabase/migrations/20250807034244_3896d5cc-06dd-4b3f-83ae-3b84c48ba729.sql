-- Fix search path for the document AI processing trigger function
CREATE OR REPLACE FUNCTION public.trigger_document_ai_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

-- Fix search path for the batch processing function
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
        SELECT id, file_name, extracted_text
        FROM public.client_documents_files 
        WHERE text_extraction_status = 'completed'
          AND (ai_analysis_summary IS NULL OR ai_suggested_category IS NULL)
          AND extracted_text IS NOT NULL 
          AND LENGTH(TRIM(extracted_text)) > 10
        ORDER BY created_at DESC
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
        PERFORM pg_sleep(0.5);
    END LOOP;
END;
$$;