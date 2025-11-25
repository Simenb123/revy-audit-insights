-- Create function and trigger to automatically create firm chat room
CREATE OR REPLACE FUNCTION public.create_firm_chat_room()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.chat_rooms (room_type, reference_id, name, description, is_active)
  VALUES (
    'firm',
    NEW.id,
    NEW.name || ' - Firmachat',
    'Generell kommunikasjon for ' || NEW.name,
    true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_audit_firm_created
  AFTER INSERT ON public.audit_firms
  FOR EACH ROW
  EXECUTE FUNCTION public.create_firm_chat_room();

-- Create function and trigger to automatically create department chat room
CREATE OR REPLACE FUNCTION public.create_department_chat_room()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  firm_name TEXT;
BEGIN
  -- Get the firm name
  SELECT name INTO firm_name
  FROM public.audit_firms
  WHERE id = NEW.audit_firm_id;
  
  INSERT INTO public.chat_rooms (room_type, reference_id, name, description, is_active)
  VALUES (
    'department',
    NEW.id,
    NEW.name || ' - Avdelingschat',
    'Kommunikasjon for avdeling ' || NEW.name || COALESCE(' i ' || firm_name, ''),
    true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_department_created
  AFTER INSERT ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_department_chat_room();

COMMENT ON FUNCTION public.create_firm_chat_room() IS 'Automatically creates a firm-wide chat room when a new audit firm is created';
COMMENT ON FUNCTION public.create_department_chat_room() IS 'Automatically creates a department chat room when a new department is created';