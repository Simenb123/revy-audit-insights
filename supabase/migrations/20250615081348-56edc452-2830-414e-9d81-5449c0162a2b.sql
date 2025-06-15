
-- Trinn 1: Opprett tabellen `document_versions` for å lagre versjonshistorikk (siden forrige forsøk feilet)
CREATE TABLE public.document_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_audit_action_id UUID NOT NULL REFERENCES public.client_audit_actions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version_name TEXT NOT NULL,
    change_source TEXT NOT NULL CHECK (change_source IN ('user', 'ai')),
    change_description TEXT,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.document_versions IS 'Lagrer versjonshistorikk for redigerbart innhold i klientrevisjonshandlinger.';
COMMENT ON COLUMN public.document_versions.version_name IS 'Et beskrivende navn for versjonen, f.eks. "v1.1-ai" eller "Brukeropprydding".';
COMMENT ON COLUMN public.document_versions.change_source IS 'Indikerer om endringen ble gjort av en "user" eller "ai".';

-- Trinn 2: Legg til en indeks for effektive søk
CREATE INDEX idx_document_versions_on_action_id ON public.document_versions (client_audit_action_id);

-- Trinn 3: Aktiver Row-Level Security (RLS)
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Trinn 4: Legg til RLS-policy for den nye tabellen
CREATE POLICY "Firmamedlemmer kan håndtere dokumentversjoner"
ON public.document_versions
FOR ALL
USING (
    get_user_firm(auth.uid()) = (
        SELECT d.audit_firm_id
        FROM public.client_audit_actions caa
        JOIN public.clients c ON caa.client_id = c.id
        LEFT JOIN public.departments d ON c.department_id = d.id
        WHERE caa.id = document_versions.client_audit_action_id
    ) OR get_user_role(auth.uid()) IN ('admin', 'partner')
)
WITH CHECK (
    created_by_user_id = auth.uid()
);

-- Trinn 5: Opprett ENUM-typen 'audit_action_type' fra bunnen av med alle verdier
CREATE TYPE public.audit_action_type AS ENUM (
    'review_completed',
    'task_assigned',
    'document_uploaded',
    'analysis_performed',
    'ai_content_generated',
    'document_version_restored'
);

-- Trinn 6: Endre `action_type` kolonnen i `audit_logs` til å bruke den nye ENUM-typen
-- Dette forutsetter at kolonnen er av en tekst-type som kan konverteres.
-- Hvis kolonnen ikke eksisterer, vil dette feile, men basert på koden bør den gjøre det.
ALTER TABLE public.audit_logs
ALTER COLUMN action_type TYPE public.audit_action_type
USING action_type::text::public.audit_action_type;
