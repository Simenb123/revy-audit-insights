-- A07 fasit (beskrivelse -> forventet fordel)
CREATE TABLE IF NOT EXISTS public.amelding_codes (
  id TEXT PRIMARY KEY, -- f.eks. 'fastloenn','timeloenn','elektroniskKommunikasjon',...
  label TEXT NOT NULL,
  expected_fordel TEXT NOT NULL CHECK (expected_fordel IN ('kontantytelse','naturalytelse','utgiftsgodtgjoerelse')),
  aliases TEXT[] DEFAULT '{}',
  inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mapping A07 -> intern kode (for avstemming)
CREATE TABLE IF NOT EXISTS public.amelding_code_map (
  a07 TEXT REFERENCES public.amelding_codes(id) ON DELETE CASCADE,
  internal_code TEXT NOT NULL,
  PRIMARY KEY (a07)
);

-- Interne koder (styrer bl.a. AGA)
CREATE TABLE IF NOT EXISTS public.internal_codes (
  id TEXT PRIMARY KEY,  -- 'fastlon','timelon','fasttillegg','bonus',...
  label TEXT NOT NULL,
  aga BOOLEAN NOT NULL DEFAULT TRUE,
  inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regler: saldobalanse-konto -> intern kode (exclusive/split/score)
CREATE TABLE IF NOT EXISTS public.mapping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  account TEXT NOT NULL,
  code TEXT NOT NULL, -- intern kode
  strategy TEXT NOT NULL DEFAULT 'score' CHECK (strategy IN ('exclusive','split','score')),
  split NUMERIC,
  weight NUMERIC DEFAULT 1,
  keywords TEXT[] DEFAULT '{}',
  regex TEXT DEFAULT '',
  priority INTEGER DEFAULT 0,
  month_hints INTEGER[] DEFAULT '{}',
  inserted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.amelding_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amelding_code_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapping_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for amelding_codes
CREATE POLICY "amelding_codes_read" ON public.amelding_codes FOR SELECT USING (TRUE);
CREATE POLICY "amelding_codes_insert" ON public.amelding_codes FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "amelding_codes_update" ON public.amelding_codes FOR UPDATE USING (TRUE);

-- RLS Policies for amelding_code_map
CREATE POLICY "amelding_code_map_read" ON public.amelding_code_map FOR SELECT USING (TRUE);
CREATE POLICY "amelding_code_map_insert" ON public.amelding_code_map FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "amelding_code_map_update" ON public.amelding_code_map FOR UPDATE USING (TRUE);

-- RLS Policies for internal_codes
CREATE POLICY "internal_codes_read" ON public.internal_codes FOR SELECT USING (TRUE);
CREATE POLICY "internal_codes_insert" ON public.internal_codes FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "internal_codes_update" ON public.internal_codes FOR UPDATE USING (TRUE);

-- RLS Policies for mapping_rules - user can only access rules for their clients
CREATE POLICY "mapping_rules_read" ON public.mapping_rules FOR SELECT 
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "mapping_rules_insert" ON public.mapping_rules FOR INSERT 
WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "mapping_rules_update" ON public.mapping_rules FOR UPDATE 
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "mapping_rules_delete" ON public.mapping_rules FOR DELETE 
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Seed data for A07 codes with expected fordel (ASCII-kanon 'utgiftsgodtgjoerelse')
INSERT INTO public.amelding_codes (id, label, expected_fordel) VALUES
 ('fastloenn','Fastlønn','kontantytelse'),
 ('timeloenn','Timelønn','kontantytelse'),
 ('bonus','Bonus','kontantytelse'),
 ('fastTillegg','Fast tillegg','kontantytelse'),
 ('feriepenger','Feriepenger','kontantytelse'),
 ('trekkILoennForFerie','Trekk i lønn for ferie','kontantytelse'),
 ('elektroniskKommunikasjon','Elektronisk kommunikasjon','naturalytelse'),
 ('skattepliktigDelForsikringer','Skattepliktig del forsikringer','naturalytelse'),
 ('kilometergodtgjoerelseBil','Kilometergodtgjørelse bil','utgiftsgodtgjoerelse'),
 ('annet','Annet','kontantytelse')
ON CONFLICT (id) DO UPDATE SET 
  label = EXCLUDED.label, 
  expected_fordel = EXCLUDED.expected_fordel;

-- A07 -> interne koder (egne for timelønn og fast tillegg)
INSERT INTO public.amelding_code_map (a07, internal_code) VALUES
 ('fastloenn','fastlon'),
 ('timeloenn','timelon'),
 ('fastTillegg','fasttillegg'),
 ('bonus','bonus'),
 ('feriepenger','feriepenger'),
 ('trekkILoennForFerie','fastlon'),
 ('elektroniskKommunikasjon','fri_telefon'),
 ('skattepliktigDelForsikringer','forsikring_skattepliktig'),
 ('kilometergodtgjoerelseBil','kilometergodtgj_opgpl'),
 ('annet','annet')
ON CONFLICT (a07) DO UPDATE SET internal_code = EXCLUDED.internal_code;

-- Interne koder (E=AGA styres her)
INSERT INTO public.internal_codes (id, label, aga) VALUES
 ('fastlon','Fastlønn', TRUE),
 ('timelon','Timelønn', TRUE),
 ('fasttillegg','Fast tillegg', TRUE),
 ('bonus','Bonus', TRUE),
 ('feriepenger','Feriepenger utbetalt', TRUE),
 ('fri_telefon','Fri telefon', TRUE),
 ('forsikring_skattepliktig','Skattepliktig del forsikringer', TRUE),
 ('kilometergodtgj_opgpl','Kilometergodtgjørelse (oppg.pl.)', TRUE),
 ('annet','Annet', TRUE)
ON CONFLICT (id) DO UPDATE SET 
  label = EXCLUDED.label, 
  aga = EXCLUDED.aga;