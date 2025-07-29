-- Fix search path for new functions
DROP FUNCTION IF EXISTS public.get_next_version_number(UUID);
DROP FUNCTION IF EXISTS public.set_active_version(UUID);

-- Recreate function with proper search path
CREATE OR REPLACE FUNCTION public.get_next_version_number(p_client_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1 
  FROM public.accounting_data_versions 
  WHERE client_id = p_client_id;
$$;

-- Recreate function with proper search path
CREATE OR REPLACE FUNCTION public.set_active_version(p_version_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  p_client_id UUID;
BEGIN
  -- Get client_id from the version
  SELECT client_id INTO p_client_id 
  FROM public.accounting_data_versions 
  WHERE id = p_version_id;
  
  -- Deactivate all versions for this client
  UPDATE public.accounting_data_versions 
  SET is_active = false, updated_at = now()
  WHERE client_id = p_client_id;
  
  -- Activate the specified version
  UPDATE public.accounting_data_versions 
  SET is_active = true, updated_at = now()
  WHERE id = p_version_id;
END;
$$;