-- Phase 1: Critical Data Exposure Security Fixes
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

-- 4. Add security logging for sensitive data access
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
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    ) || p_metadata
  );
END;
$function$;

-- 5. Create security monitoring trigger for sensitive table access
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Log access to sensitive tables
  PERFORM public.log_security_event(
    'sensitive_data_access',
    'info',
    'Access to sensitive table: ' || TG_TABLE_NAME,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Apply monitoring triggers to sensitive tables
CREATE TRIGGER log_legal_documents_access
  AFTER SELECT ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER log_legal_citations_access
  AFTER SELECT ON public.legal_citations
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER log_knowledge_tags_access
  AFTER SELECT ON public.knowledge_article_tags
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();