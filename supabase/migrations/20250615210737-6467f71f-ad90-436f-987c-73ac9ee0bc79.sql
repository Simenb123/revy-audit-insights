
-- Dette skriptet bygger ut kunnskapsbasen med flere sentrale ISA-standarder.
DO $$
DECLARE
    revisjonsstandarder_cat_id UUID;
    isa_500_cat_id UUID;
    isa_530_cat_id UUID;
    isa_700_cat_id UUID;
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
      ('ISA 500', 'Revisjonsbevis', 50, 'FileSearch', revisjonsstandarder_cat_id),
      ('ISA 530', 'Revisjonsutvalg', 60, 'ListChecks', revisjonsstandarder_cat_id),
      ('ISA 700', 'Utforming av en mening og rapportering om regnskapet', 70, 'FileSignature', revisjonsstandarder_cat_id)
    ON CONFLICT (name) DO NOTHING;

    -- Hent ID-ene til de nye (eller eksisterende) kategoriene.
    SELECT id INTO isa_500_cat_id FROM public.knowledge_categories WHERE name = 'ISA 500' LIMIT 1;
    SELECT id INTO isa_530_cat_id FROM public.knowledge_categories WHERE name = 'ISA 530' LIMIT 1;
    SELECT id INTO isa_700_cat_id FROM public.knowledge_categories WHERE name = 'ISA 700' LIMIT 1;

    -- Finn en gyldig bruker-ID fra profiler-tabellen for å bruke som forfatter.
    SELECT id INTO author_user_id FROM public.profiles LIMIT 1;
    IF author_user_id IS NULL THEN
        RAISE NOTICE 'Fant ingen brukere i profiltabellen. Artiklene vil ikke bli opprettet.';
        RETURN;
    END IF;

    -- Trinn 3: Legg inn eksempelartikler for hver ISA-standard.
    -- ISA 500 Artikler
    IF isa_500_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at)
        VALUES
          ('ISA 500: Tilstrekkelig og egnet revisjonsbevis', 'isa-500-revisjonsbevis', 'Revisor skal utforme og gjennomføre revisjonshandlinger for å innhente tilstrekkelig og egnet revisjonsbevis.', 'Revisjonsbevis er nødvendig for å underbygge revisors mening og rapport. Tilstrekkelighet er et mål på mengden bevis, mens egnethet er et mål på kvaliteten – dvs. relevansen og påliteligheten. Hva som er tilstrekkelig og egnet, avhenger av vurderingen av risikoene for vesentlig feilinformasjon.', isa_500_cat_id, 'published', author_user_id, '{"isa", "revisjonsbevis", "dokumentasjon"}', 'ISA 500.6', now())
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- ISA 530 Artikler
    IF isa_530_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at)
        VALUES
          ('ISA 530: Bruk av revisjonsutvalg', 'isa-530-revisjonsutvalg', 'Standarden omhandler revisors bruk av statistiske og ikke-statistiske utvalg for å trekke konklusjoner om en populasjon.', 'Ved utforming av et revisjonsutvalg skal revisor vurdere formålet med revisjonshandlingen og populasjonens egenskaper. Målet er å gi et rimelig grunnlag for revisor til å trekke konklusjoner om hele populasjonen som utvalget er trukket fra.', isa_530_cat_id, 'published', author_user_id, '{"isa", "utvalg", "sampling", "statistikk"}', 'ISA 530.4', now())
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    -- ISA 700 Artikler
    IF isa_700_cat_id IS NOT NULL THEN
        INSERT INTO public.knowledge_articles (title, slug, summary, content, category_id, status, author_id, tags, reference_code, published_at)
        VALUES
          ('ISA 700: Revisors rapport', 'isa-700-revisors-rapport', 'Denne standarden omhandler revisors ansvar for å danne seg en mening om regnskapet og formen og innholdet i revisjonsberetningen.', 'Revisjonsberetningen er det endelige produktet av revisjonen. Den skal inneholde en klar, skriftlig uttalelse om regnskapet i et standardisert format. Standarden beskriver elementene i en standard (ukvalifisert) revisjonsberetning.', isa_700_cat_id, 'published', author_user_id, '{"isa", "rapportering", "revisjonsberetning", "konklusjon"}', 'ISA 700.10', now())
        ON CONFLICT (slug) DO NOTHING;
    END IF;

END $$;
