
-- Utvider kunnskapsbasen med flere sentrale ISA-standarder for risikovurdering og planlegging (korrigert versjon).
DO $$
DECLARE
    revisjonsstandarder_cat_id UUID;
    isa_240_cat_id UUID;
    isa_315_cat_id UUID;
    isa_330_cat_id UUID;
    author_user_id UUID;
BEGIN
    -- Trinn 1: Finn ID-en til hovedkategorien 'Revisjonsstandarder'.
    SELECT id INTO revisjonsstandarder_cat_id FROM public.knowledge_categories WHERE name = 'Revisjonsstandarder' LIMIT 1;

    -- Avbryt hvis kategorien ikke finnes.
    IF revisjonsstandarder_cat_id IS NULL THEN
        RAISE EXCEPTION 'Hovedkategorien "Revisjonsstandarder" ble ikke funnet. Kan ikke fortsette.';
    END IF;

    -- Trinn 2: Opprett underkategorier for flere ISA-standarder.
    INSERT INTO public.knowledge_categories (name, description, display_order, icon, parent_category_id)
    VALUES
      ('ISA 240', 'Revisors ansvar knyttet til misligheter', 24, 'ShieldAlert', revisjonsstandarder_cat_id),
      ('ISA 315 (Revised 2019)', 'Identifisering og vurdering av risikoene for vesentlig feilinformasjon', 31, 'Projector', revisjonsstandarder_cat_id),
      ('ISA 330', 'Revisors handlinger for å møte vurderte risikoer', 33, 'Reply', revisjonsstandarder_cat_id)
    ON CONFLICT (name) DO NOTHING;

    -- Hent ID-ene til de nye (eller eksisterende) kategoriene.
    SELECT id INTO isa_240_cat_id FROM public.knowledge_categories WHERE name = 'ISA 240' LIMIT 1;
    SELECT id INTO isa_315_cat_id FROM public.knowledge_categories WHERE name = 'ISA 315 (Revised 2019)' LIMIT 1;
    SELECT id INTO isa_330_cat_id FROM public.knowledge_categories WHERE name = 'ISA 330' LIMIT 1;
    
    -- Finn en gyldig bruker-ID fra profiler-tabellen for å bruke som forfatter.
    SELECT id INTO author_user_id FROM public.profiles LIMIT 1;
    IF author_user_id IS NULL THEN
        RAISE NOTICE 'Fant ingen brukere i profiltabellen. Artiklene vil ikke bli opprettet.';
        RETURN;
    END IF;

    -- Trinn 3: Legg inn eksempelartikler for hver ny ISA-standard.
    -- ISA 240 Artikler
    IF isa_240_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at, valid_from, valid_until)
        VALUES
          ('ISA 240: Identifisere og vurdere risiko for misligheter', 'isa-240-risikovurdering-misligheter', 'Standarden omhandler revisors ansvar for å innhente tilstrekkelig og egnet revisjonsbevis vedrørende risikoene for vesentlig feilinformasjon som skyldes misligheter.', 'Revisor må opprettholde en profesjonell skepsis gjennom hele revisjonen, og vurdere potensialet for at ledelsen overstyrer kontroller. Dette inkluderer å utføre handlinger for å avdekke misligheter, som for eksempel uventede regnskapsmessige endringer eller transaksjoner utenfor den vanlige forretningsdriften.', isa_240_cat_id, 'published', author_user_id, '{"isa", "misligheter", "svindel", "risikovurdering"}', 'ISA 240.12', now(), '2022-12-15', NULL)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- ISA 315 Artikler
    IF isa_315_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at, valid_from, valid_until)
        VALUES
          ('ISA 315: Forståelse av foretaket og dets omgivelser', 'isa-315-forstaaelse-foretaket', 'For å identifisere og vurdere risikoer, må revisor få en forståelse av foretaket og dets omgivelser, inkludert foretakets interne kontroll.', 'Denne forståelsen danner grunnlaget for å utforme og gjennomføre videre revisjonshandlinger. Revisoren må vurdere bransjefaktorer, regulatoriske faktorer, og andre eksterne faktorer, samt foretakets art, mål og strategier, og måling og vurdering av dets økonomiske resultater.', isa_315_cat_id, 'published', author_user_id, '{"isa", "risikovurdering", "internkontroll", "planlegging"}', 'ISA 315.19', now(), '2021-12-15', NULL)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- ISA 330 Artikler
    IF isa_330_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at, valid_from, valid_until)
        VALUES
          ('ISA 330: Møte vurderte risikoer', 'isa-330-moete-risikoer', 'Standarden krever at revisor utformer og gjennomfører overordnede handlinger for å møte de vurderte risikoene for vesentlig feilinformasjon på regnskapsnivå.', 'Revisors handlinger må være en direkte respons på de identifiserte risikoene. Dette innebærer å utforme og gjennomføre substanshandlinger og, i noen tilfeller, tester av kontroller, for å innhente tilstrekkelig og egnet revisjonsbevis.', isa_330_cat_id, 'published', author_user_id, '{"isa", "substanshandlinger", "kontrolltester", "revisjonshandlinger"}', 'ISA 330.5', now(), '2022-01-01', NULL)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

END $$;
