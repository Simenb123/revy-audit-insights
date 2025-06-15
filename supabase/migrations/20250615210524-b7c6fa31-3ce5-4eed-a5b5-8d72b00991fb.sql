
-- Dette skriptet bygger ut kunnskapsbasen med struktur for ISA-standarder.
DO $$
DECLARE
    revisjonsstandarder_cat_id UUID;
    isa_200_cat_id UUID;
    isa_230_cat_id UUID;
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

    -- Trinn 2: Opprett underkategorier for sentrale ISA-standarder.
    -- Bruker ON CONFLICT for å unngå duplikater hvis skriptet kjøres flere ganger.
    INSERT INTO public.knowledge_categories (name, description, display_order, icon, parent_category_id)
    VALUES
      ('ISA 200', 'Overordnede mål for den uavhengige revisor og gjennomføringen av en revisjon i samsvar med ISA-ene', 10, 'Milestone', revisjonsstandarder_cat_id),
      ('ISA 230', 'Revisjonsdokumentasjon', 20, 'FileText', revisjonsstandarder_cat_id),
      ('ISA 315', 'Identifisering og vurdering av risikoene for vesentlig feilinformasjon', 30, 'Search', revisjonsstandarder_cat_id),
      ('ISA 330', 'Revisors handlinger for å møte vurderte risikoer', 40, 'Target', revisjonsstandarder_cat_id)
    ON CONFLICT (name) DO NOTHING;

    -- Hent ID-ene til de nye (eller eksisterende) kategoriene.
    SELECT id INTO isa_200_cat_id FROM public.knowledge_categories WHERE name = 'ISA 200' LIMIT 1;
    SELECT id INTO isa_230_cat_id FROM public.knowledge_categories WHERE name = 'ISA 230' LIMIT 1;
    SELECT id INTO isa_315_cat_id FROM public.knowledge_categories WHERE name = 'ISA 315' LIMIT 1;
    SELECT id INTO isa_330_cat_id FROM public.knowledge_categories WHERE name = 'ISA 330' LIMIT 1;
    
    -- Finn en gyldig bruker-ID fra profiler-tabellen for å bruke som forfatter.
    SELECT id INTO author_user_id FROM public.profiles LIMIT 1;
    IF author_user_id IS NULL THEN
        RAISE NOTICE 'Fant ingen brukere i profiltabellen. Artiklene vil ikke bli opprettet.';
        RETURN;
    END IF;

    -- Trinn 3: Legg inn eksempelartikler for hver ISA-standard.
    -- ISA 200 Artikler
    IF isa_200_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at)
        VALUES
          ('ISA 200: Overordnede mål', 'isa-200-overordnede-maal', 'Denne delen beskriver de overordnede målene for en revisor ved gjennomføring av en revisjon av et regnskap.', 'Innholdet i ISA 200 fokuserer på revisors ansvar for å oppnå en rimelig sikkerhet for at regnskapet som helhet ikke inneholder vesentlig feilinformasjon, enten det skyldes misligheter eller feil. Dette gjør at revisor kan uttale seg om hvorvidt regnskapet er utarbeidet, i alle vesentlige henseender, i samsvar med et aktuelt rammeverk for finansiell rapportering.', isa_200_cat_id, 'published', author_user_id, '{"isa", "mål", "revisjon"}', 'ISA 200', now()),
          ('ISA 200: Profesjonell skeptisisme', 'isa-200-profesjonell-skeptisisme', 'Revisor skal planlegge og gjennomføre revisjonen med profesjonell skeptisisme og anerkjenne at det kan eksistere omstendigheter som forårsaker at regnskapet inneholder vesentlig feilinformasjon.', 'Profesjonell skeptisisme innebærer en spørrende holdning, å være oppmerksom på forhold som kan indikere mulig feilinformasjon som skyldes feil eller misligheter, og en kritisk vurdering av revisjonsbevis.', isa_200_cat_id, 'published', author_user_id, '{"isa", "skeptisisme", "holdning"}', 'ISA 200.15', now())
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- ISA 230 Artikler
    IF isa_230_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at)
        VALUES
          ('ISA 230: Formål med revisjonsdokumentasjon', 'isa-230-formaal-dokumentasjon', 'Dokumentasjonen skal gi tilstrekkelig og egnet grunnlag for revisors uttalelse og bevis for at revisjonen er planlagt og gjennomført i henhold til ISA-ene og gjeldende lov- og forskriftskrav.', 'God dokumentasjon er avgjørende for kvaliteten på revisjonen. Den muliggjør effektiv planlegging, gjennomføring og tilsyn med revisjonsoppdraget, samt at teamet kan holdes ansvarlig for sitt arbeid. Den danner også grunnlaget for kvalitetskontroller og inspeksjoner.', isa_230_cat_id, 'published', author_user_id, '{"isa", "dokumentasjon", "arbeidspapir"}', 'ISA 230.2', now())
        ON CONFLICT (slug) DO NOTHING;
    END IF;
    
    -- ISA 315 Artikler
    IF isa_315_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at)
        VALUES
          ('ISA 315: Forståelse av enheten og dens omgivelser', 'isa-315-forstaaelse-enheten', 'Revisor skal opparbeide seg en forståelse av enheten og dens omgivelser, inkludert enhetens interne kontroll, for å kunne identifisere og vurdere risikoene for vesentlig feilinformasjon.', 'Dette er grunnlaget for å utforme og implementere handlinger som møter de vurderte risikoene. Forståelsen omfatter bransjeforhold, regulatoriske faktorer, enhetens art, eier- og styringsforhold, og enhetens valg og anvendelse av regnskapsprinsipper.', isa_315_cat_id, 'published', author_user_id, '{"isa", "risikovurdering", "internkontroll"}', 'ISA 315.11', now())
        ON CONFLICT (slug) DO NOTHING;
    END IF;

END $$;
