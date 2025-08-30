-- Fix trigger creation issue
DROP TRIGGER IF EXISTS update_import_sessions_updated_at ON public.import_sessions;

CREATE TRIGGER update_import_sessions_updated_at
    BEFORE UPDATE ON public.import_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();