-- Security fixes for RLS policies and function hardening

-- Phase 1: Fix missing RLS policies for tables that have RLS enabled but no policies

-- Add RLS policies for learning_certifications (users can access their own certifications)
CREATE POLICY "Users can view their own certifications" 
ON public.learning_certifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certifications" 
ON public.learning_certifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications" 
ON public.learning_certifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add RLS policies for learning_path_modules (authenticated users can view published modules)
CREATE POLICY "Authenticated users can view published learning path modules" 
ON public.learning_path_modules 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage learning path modules" 
ON public.learning_path_modules 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]));

-- Add RLS policies for test_scenarios (authenticated users can access)
CREATE POLICY "Authenticated users can view test scenarios" 
ON public.test_scenarios 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage test scenarios" 
ON public.test_scenarios 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]));

-- Add RLS policies for learning_notifications (users can access their own notifications)
CREATE POLICY "Users can view their own learning notifications" 
ON public.learning_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learning notifications" 
ON public.learning_notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning notifications" 
ON public.learning_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Phase 2: Harden database functions by setting secure search paths

-- Fix functions with mutable search paths
CREATE OR REPLACE FUNCTION public.update_unified_categories_updated_at()
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

CREATE OR REPLACE FUNCTION public.update_potential_clients_updated_at()
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

CREATE OR REPLACE FUNCTION public.update_ai_analysis_updated_at()
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

CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_analysis_cache()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_analysis_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.increment_cache_hit(hash_to_update text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.ai_cache
  SET
    hits = hits + 1,
    last_hit_at = now()
  WHERE request_hash = hash_to_update;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$function$;

-- Phase 3: Enhanced security function for logging security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type text,
    p_severity text DEFAULT 'info',
    p_description text DEFAULT '',
    p_metadata jsonb DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    INSERT INTO public.admin_audit_logs (
        user_id,
        action_type,
        description,
        metadata,
        created_at
    ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        p_event_type,
        p_description,
        p_metadata || jsonb_build_object('severity', p_severity),
        now()
    );
END;
$function$;

-- Phase 4: Secure update user role function (if not exists)
CREATE OR REPLACE FUNCTION public.secure_update_user_role(
    p_user_id uuid,
    p_new_role user_role_type
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    current_user_role user_role_type;
    target_user_firm uuid;
    current_user_firm uuid;
BEGIN
    -- Get current user role and firm
    SELECT user_role, audit_firm_id INTO current_user_role, current_user_firm
    FROM public.profiles WHERE id = auth.uid();
    
    -- Get target user's firm
    SELECT audit_firm_id INTO target_user_firm
    FROM public.profiles WHERE id = p_user_id;
    
    -- Security checks
    IF current_user_role NOT IN ('admin', 'partner') THEN
        RAISE EXCEPTION 'Insufficient permissions to change user roles';
    END IF;
    
    IF current_user_firm != target_user_firm THEN
        RAISE EXCEPTION 'Cannot change roles for users outside your firm';
    END IF;
    
    -- Update the role
    UPDATE public.profiles 
    SET user_role = p_new_role, updated_at = now()
    WHERE id = p_user_id;
    
    RETURN true;
END;
$function$;