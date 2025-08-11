-- 1) Enum for ansattstatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status_type') THEN
    CREATE TYPE public.employee_status_type AS ENUM ('pre_registered','active','inactive','student','test');
  END IF;
END $$;

-- 2) Tabell for firm_employees
CREATE TABLE IF NOT EXISTS public.firm_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_firm_id uuid NOT NULL REFERENCES public.audit_firms(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  email text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role user_role_type NOT NULL DEFAULT 'employee',
  status employee_status_type NOT NULL DEFAULT 'pre_registered',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_firm_employees_profile UNIQUE (profile_id)
);

-- Unik e-post pr. firma (case-insensitiv) når e-post finnes
CREATE UNIQUE INDEX IF NOT EXISTS uq_firm_employees_firm_email
ON public.firm_employees (audit_firm_id, lower(email))
WHERE email IS NOT NULL;

-- 3) RLS
ALTER TABLE public.firm_employees ENABLE ROW LEVEL SECURITY;

-- Lesetilgang for alle i samme firma
DROP POLICY IF EXISTS firm_employees_select ON public.firm_employees;
CREATE POLICY firm_employees_select
ON public.firm_employees
FOR SELECT
USING (audit_firm_id = public.get_user_firm(auth.uid()));

-- Opprett/oppdater/slett for admin/partner/manager i samme firma
DROP POLICY IF EXISTS firm_employees_iud ON public.firm_employees;
CREATE POLICY firm_employees_iud
ON public.firm_employees
FOR ALL
USING (
  audit_firm_id = public.get_user_firm(auth.uid()) AND 
  public.get_user_role(auth.uid()) IN ('admin','partner','manager')
)
WITH CHECK (
  audit_firm_id = public.get_user_firm(auth.uid()) AND 
  public.get_user_role(auth.uid()) IN ('admin','partner','manager')
);

-- 4) updated_at trigger
DROP TRIGGER IF EXISTS trg_firm_employees_updated_at ON public.firm_employees;
CREATE TRIGGER trg_firm_employees_updated_at
BEFORE UPDATE ON public.firm_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Funksjon: koble firm_employee til eksisterende profile ved innsetting/oppdatering
CREATE OR REPLACE FUNCTION public.link_firm_employee_to_profile()
RETURNS trigger AS $$
DECLARE
  pid uuid;
BEGIN
  IF NEW.email IS NOT NULL THEN
    SELECT p.id INTO pid
    FROM public.profiles p
    WHERE p.audit_firm_id = NEW.audit_firm_id
      AND lower(p.email) = lower(NEW.email)
    LIMIT 1;

    IF pid IS NOT NULL THEN
      NEW.profile_id := pid;
      -- Promoter status fra pre_registered til active automatisk
      IF NEW.status = 'pre_registered' THEN
        NEW.status := 'active';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trg_link_employee_profile_ins ON public.firm_employees;
CREATE TRIGGER trg_link_employee_profile_ins
BEFORE INSERT ON public.firm_employees
FOR EACH ROW
EXECUTE FUNCTION public.link_firm_employee_to_profile();

DROP TRIGGER IF EXISTS trg_link_employee_profile_upd ON public.firm_employees;
CREATE TRIGGER trg_link_employee_profile_upd
BEFORE UPDATE ON public.firm_employees
FOR EACH ROW
EXECUTE FUNCTION public.link_firm_employee_to_profile();

-- 6) Funksjon: koble ny/oppdatert profile til eksisterende firm_employee (pre-registrert)
CREATE OR REPLACE FUNCTION public.link_profile_to_firm_employee()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.audit_firm_id IS NOT NULL THEN
    UPDATE public.firm_employees fe
    SET profile_id = NEW.id,
        status = CASE WHEN fe.status = 'pre_registered' THEN 'active' ELSE fe.status END,
        updated_at = now()
    WHERE fe.profile_id IS NULL
      AND fe.audit_firm_id = NEW.audit_firm_id
      AND lower(COALESCE(fe.email,'')) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Utloeser ved nye profiler og relevante oppdateringer
DROP TRIGGER IF EXISTS trg_link_profile_employee_ins ON public.profiles;
CREATE TRIGGER trg_link_profile_employee_ins
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.link_profile_to_firm_employee();

DROP TRIGGER IF EXISTS trg_link_profile_employee_upd ON public.profiles;
CREATE TRIGGER trg_link_profile_employee_upd
AFTER UPDATE OF email, audit_firm_id ON public.profiles
FOR EACH ROW
WHEN ((OLD.email IS DISTINCT FROM NEW.email) OR (OLD.audit_firm_id IS DISTINCT FROM NEW.audit_firm_id))
EXECUTE FUNCTION public.link_profile_to_firm_employee();