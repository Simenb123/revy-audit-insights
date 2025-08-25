-- Migrasjon for Aksjonærregister
-- Opprett tabeller for aksjonærinformasjon med RLS og indekser

-- Aktiver pg_trgm for trigram-søk
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Opprett tabell for aksjeselskaper
CREATE TABLE IF NOT EXISTS public.share_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orgnr text NOT NULL,
  name text NOT NULL,
  total_shares bigint DEFAULT 0,
  year integer NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Unikhetsbegrensning per org nummer, år og bruker
  UNIQUE(orgnr, year, user_id)
);

-- Opprett tabell for aksjonærer/enheter (personer og selskaper)
CREATE TABLE IF NOT EXISTS public.share_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('person', 'company')),
  name text NOT NULL,
  country_code text,
  birth_year integer,
  orgnr text, -- Kun for selskaper
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Unikhetsbegrensning basert på orgnr eller navn+fødselsår
  UNIQUE(COALESCE(orgnr, name || ':' || COALESCE(birth_year::text, '')), user_id)
);

-- Opprett tabell for aksjeinnehav
CREATE TABLE IF NOT EXISTS public.share_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_orgnr text NOT NULL,
  holder_id uuid NOT NULL REFERENCES public.share_entities(id) ON DELETE CASCADE,
  share_class text NOT NULL,
  shares bigint NOT NULL DEFAULT 0,
  year integer NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Unikhetsbegrensning per selskap, eier, aksjeklasse, år og bruker
  UNIQUE(company_orgnr, holder_id, share_class, year, user_id)
);

-- Opprett indekser for ytelse
CREATE INDEX IF NOT EXISTS idx_share_companies_orgnr_year ON public.share_companies(orgnr, year);
CREATE INDEX IF NOT EXISTS idx_share_companies_user_id ON public.share_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_share_companies_name_trgm ON public.share_companies USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_share_entities_user_id ON public.share_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_share_entities_name_trgm ON public.share_entities USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_share_entities_orgnr ON public.share_entities(orgnr);

CREATE INDEX IF NOT EXISTS idx_share_holdings_company_orgnr_year ON public.share_holdings(company_orgnr, year);
CREATE INDEX IF NOT EXISTS idx_share_holdings_holder_id ON public.share_holdings(holder_id);
CREATE INDEX IF NOT EXISTS idx_share_holdings_user_id ON public.share_holdings(user_id);

-- Aktiver Row Level Security
ALTER TABLE public.share_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_holdings ENABLE ROW LEVEL SECURITY;

-- RLS-policies for share_companies
CREATE POLICY "Users can manage their own share companies" ON public.share_companies
  FOR ALL USING (auth.uid() = user_id);

-- RLS-policies for share_entities  
CREATE POLICY "Users can manage their own share entities" ON public.share_entities
  FOR ALL USING (auth.uid() = user_id);

-- RLS-policies for share_holdings
CREATE POLICY "Users can manage their own share holdings" ON public.share_holdings
  FOR ALL USING (auth.uid() = user_id);

-- Opprett storage bucket for aksjonærregister filer
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shareholders', 'shareholders', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Users can upload their own shareholder files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'shareholders' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own shareholder files" ON storage.objects
  FOR SELECT USING (bucket_id = 'shareholders' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own shareholder files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'shareholders' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own shareholder files" ON storage.objects
  FOR DELETE USING (bucket_id = 'shareholders' AND auth.uid()::text = (storage.foldername(name))[1]);