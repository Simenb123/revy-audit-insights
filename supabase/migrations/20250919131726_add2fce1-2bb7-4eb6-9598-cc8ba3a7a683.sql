-- Create clear_shareholders_staging RPC function
CREATE OR REPLACE FUNCTION public.clear_shareholders_staging(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM shareholders_staging WHERE user_id = p_user_id;
  
  RAISE NOTICE 'Cleared shareholders_staging for user_id: %', p_user_id;
END;
$$;