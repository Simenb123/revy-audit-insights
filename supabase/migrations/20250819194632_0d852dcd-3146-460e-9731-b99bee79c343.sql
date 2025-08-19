-- Opprett tabell for NAringsspesifikasjon
CREATE TABLE IF NOT EXISTS public.naeringsspesifikasjon (
  kode TEXT PRIMARY KEY,                 -- f.eks. '6700', '1550.1'
  navn TEXT NOT NULL,                    -- f.eks. 'Regnskapstjenester, rådgivning med mer'
  na_regnskapslinjenummer TEXT,          -- til fremtidig bruk
  na_regnskapslinjenavn TEXT,            -- til fremtidig bruk
  sort INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  normalized_code TEXT GENERATED ALWAYS AS (
    regexp_replace(replace(kode, ',', '.'), '[^0-9.\-]', '', 'g')
  ) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opprett index for rask prefiks-matching
CREATE INDEX IF NOT EXISTS naeringsspesifikasjon_normalized_code_idx
  ON public.naeringsspesifikasjon (normalized_code);

-- Aktiver Row Level Security
ALTER TABLE public.naeringsspesifikasjon ENABLE ROW LEVEL SECURITY;

-- Slett eksisterende policy hvis den finnes, deretter opprett ny
DROP POLICY IF EXISTS "select_active_auth" ON public.naeringsspesifikasjon;
CREATE POLICY "select_active_auth"
  ON public.naeringsspesifikasjon FOR SELECT
  TO authenticated
  USING (active = true);