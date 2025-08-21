-- Phase 1: Critical Data Exposure Security Fixes (Corrected)
-- Restrict access to legal documents, citations, and knowledge article tags

-- 1. Secure Legal Documents - Restrict to authenticated users with appropriate roles
DROP POLICY IF EXISTS "Legal documents are publicly viewable" ON public.legal_documents;

CREATE POLICY "Legal documents require authentication" 
ON public.legal_documents 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
);

-- 2. Secure Legal Citations - Restrict to authenticated users
DROP POLICY IF EXISTS "Legal citations are publicly viewable" ON public.legal_citations;

CREATE POLICY "Legal citations require authentication" 
ON public.legal_citations 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
);

-- 3. Secure Knowledge Article Tags - Restrict to authenticated users
DROP POLICY IF EXISTS "Knowledge article tags are publicly viewable" ON public.knowledge_article_tags;

CREATE POLICY "Knowledge article tags require authentication" 
ON public.knowledge_article_tags 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
);

-- 4. Add security logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text DEFAULT 'info',
  p_description text DEFAULT '',
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.admin_audit_logs (
    user_id,
    target_user_id,
    action_type,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    NULL,
    p_event_type,
    p_description,
    jsonb_build_object(
      'severity', p_severity,
      'timestamp', now(),
      'request_metadata', current_setting('request.headers', true)
    ) || COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$function$;