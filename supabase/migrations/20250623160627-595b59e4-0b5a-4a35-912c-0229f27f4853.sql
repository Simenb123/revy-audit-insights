
-- Create a trigger function that automatically generates embeddings for published articles
CREATE OR REPLACE FUNCTION public.auto_generate_embeddings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  supabase_anon_key text;
BEGIN
  -- Only process if the article is published and doesn't already have embeddings
  IF NEW.status = 'published' AND (NEW.embedding IS NULL OR OLD.embedding IS NULL) THEN
    -- Get environment variables (these should be set in your Supabase project settings)
    supabase_url := current_setting('app.supabase_url', true);
    supabase_anon_key := current_setting('app.supabase_anon_key', true);
    
    -- Fallback to hardcoded values if environment variables are not set
    -- TODO: Remove these fallbacks once environment variables are properly configured
    IF supabase_url IS NULL OR supabase_url = '' THEN
      supabase_url := 'https://fxelhfwaoizqyecikscu.supabase.co';
    END IF;
    
    IF supabase_anon_key IS NULL OR supabase_anon_key = '' THEN
      supabase_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc';
    END IF;
    
    -- Call the generate-embeddings function
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/generate-embeddings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_anon_key
      ),
      body := json_build_object('article_id', NEW.id)::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for INSERT and UPDATE operations
DROP TRIGGER IF EXISTS trigger_auto_generate_embeddings ON public.knowledge_articles;

CREATE TRIGGER trigger_auto_generate_embeddings
  AFTER INSERT OR UPDATE OF status, title, content
  ON public.knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_embeddings();

-- Enable the pg_net extension if not already enabled (for HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net;
