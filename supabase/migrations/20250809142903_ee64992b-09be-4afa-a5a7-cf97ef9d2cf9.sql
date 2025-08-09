
-- 1) Legg til kolonnen "is_active" på clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Valgfritt: legg til en kommentar for dokumentasjon
COMMENT ON COLUMN public.clients.is_active IS 'Om klienten er aktiv (true=Ja, false=Nei)';
