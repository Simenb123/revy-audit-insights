
-- Enum for de nye planleggingsmodulene basert på din detaljerte plan.
CREATE TYPE planning_module_key AS ENUM (
    'ANALYTICAL_REVIEW',
    'TEAM_DISCUSSION',
    'MANAGEMENT_INQUIRY',
    'OBSERVATION_INSPECTION',
    'GOING_CONCERN',
    'OPENING_BALANCE',
    'FRAUD_RISK',
    'ESTIMATES_PROFILE',
    'MATERIALITY',
    'RISK_MATRIX'
);

-- En tabell for å spore statusen til hver planleggingsmodul for en spesifikk klient.
-- Dette vil hjelpe oss å bygge et brukergrensesnitt som viser fremdrift.
CREATE TABLE public.planning_module_statuses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    module_key planning_module_key NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started', -- f.eks. 'not_started', 'in_progress', 'completed'
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(client_id, module_key)
);

-- Tabell for Modul 2.9: Vesentlighet & arbeids-vesentlighet
CREATE TABLE public.planning_materiality (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
    benchmark_basis TEXT, -- f.eks. "Driftsinntekter", "Resultat før skatt"
    benchmark_amount NUMERIC,
    materiality_percentage NUMERIC,
    overall_materiality NUMERIC,
    performance_materiality_percentage NUMERIC,
    performance_materiality NUMERIC,
    trivial_threshold NUMERIC,
    justification TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legger til en trigger som automatisk oppdaterer 'updated_at'-feltet
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.planning_materiality
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Tabell for Modul 2.7: Mislighets-modul
CREATE TABLE public.planning_fraud_risks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
    -- Seksjon for 'Ledelsens overstyring'
    management_override_risk_assessment TEXT,
    -- Seksjon for 'Inntektsmanipulasjon'
    revenue_manipulation_risk_assessment TEXT,
    -- Seksjon for 'Nærstående parter'
    related_parties_risk_assessment TEXT,
    -- Seksjon for 'Andre risikoer'
    other_risks JSONB, -- Eksempel: [{ description: string, assessment: string }]
    -- Sammendrag fra teamdiskusjon
    team_discussion_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legger til en trigger som automatisk oppdaterer 'updated_at'-feltet
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.planning_fraud_risks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Aktiverer Row Level Security (RLS) for de nye tabellene
ALTER TABLE public.planning_module_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_materiality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_fraud_risks ENABLE ROW LEVEL SECURITY;

-- Grunnleggende RLS-policyer for påloggede brukere.
-- Disse er et utgangspunkt og kan gjøres mer spesifikke senere (f.eks. basert på rolle eller firma).
CREATE POLICY "Allow authenticated users to access planning statuses"
ON public.planning_module_statuses FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access materiality"
ON public.planning_materiality FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access fraud risks"
ON public.planning_fraud_risks FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

