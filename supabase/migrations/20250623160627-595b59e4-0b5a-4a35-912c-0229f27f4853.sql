
-- Create a trigger function that automatically generates embeddings for published articles
CREATE OR REPLACE FUNCTION public.auto_generate_embeddings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
