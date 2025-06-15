
-- Trinn 1: Legg til ny handlingstype for logging av versjonsopprettelse
ALTER TYPE public.audit_action_type ADD VALUE IF NOT EXISTS 'document_version_created';

-- Trinn 2: Fjern den gamle, generiske RLS-policyen for dokumentversjoner
DROP POLICY IF EXISTS "Firmamedlemmer kan håndtere dokumentversjoner" ON public.document_versions;

-- Trinn 3: Opprett nye, mer spesifikke RLS-policyer

-- SELECT policy: Tillater brukere å se versjoner som tilhører deres firma.
CREATE POLICY "Brukere kan se versjoner for sitt firma"
ON public.document_versions
FOR SELECT
USING (
    get_user_firm(auth.uid()) = (
        SELECT d.audit_firm_id
        FROM public.client_audit_actions caa
        JOIN public.clients c ON caa.client_id = c.id
        LEFT JOIN public.departments d ON c.department_id = d.id
        WHERE caa.id = document_versions.client_audit_action_id
    ) OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

-- INSERT policy: Tillater brukere å lage versjoner for sitt firma.
CREATE POLICY "Brukere kan opprette versjoner for sitt firma"
ON public.document_versions
FOR INSERT
WITH CHECK (
  created_by_user_id = auth.uid() AND
  ((
    get_user_firm(auth.uid()) = (
        SELECT d.audit_firm_id
        FROM public.client_audit_actions caa
        JOIN public.clients c ON caa.client_id = c.id
        LEFT JOIN public.departments d ON c.department_id = d.id
        WHERE caa.id = document_versions.client_audit_action_id
    )
  ) OR get_user_role(auth.uid()) IN ('admin', 'partner'))
);

-- UPDATE policy: Forbyr oppdateringer for å sikre historikkens integritet.
CREATE POLICY "Versjoner kan ikke endres"
ON public.document_versions
FOR UPDATE
USING (false);

-- DELETE policy: Kun administratorer kan slette versjoner (f.eks. for opprydding).
CREATE POLICY "Administratorer kan slette versjoner"
ON public.document_versions
FOR DELETE
USING (
  get_user_role(auth.uid()) IN ('admin')
);
