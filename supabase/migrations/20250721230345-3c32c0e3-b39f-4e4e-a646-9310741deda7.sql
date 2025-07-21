-- Fase 3: Forenklet datastruktur
-- Konsolider categories og subject_areas til en unified struktur

-- 1. Opprett en ny enhetlig tabell for fagområder/kategorier
CREATE TABLE IF NOT EXISTS unified_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    category_type TEXT NOT NULL DEFAULT 'subject_area', -- 'subject_area', 'content_type', 'process', 'compliance'
    parent_id UUID REFERENCES unified_categories(id),
    sort_order INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Norsk revisjon spesifikke felt
    isa_standard_reference TEXT[], -- f.eks. ['ISA 315', 'ISA 330']
    audit_phases TEXT[] DEFAULT ARRAY['planning', 'execution', 'completion'], -- hvilke faser dette gjelder
    risk_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    compliance_framework TEXT[], -- f.eks. ['bokføringsloven', 'regnskapsloven', 'hvitvaskingsloven']
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE unified_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view unified categories" ON unified_categories
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage unified categories" ON unified_categories
FOR ALL USING (auth.role() = 'authenticated');

-- 2. Populer med norsk revisjon-spesifikke kategorier
INSERT INTO unified_categories (name, display_name, description, category_type, sort_order, color, audit_phases, isa_standard_reference, risk_level) VALUES

-- Hovedområder for norsk revisjon
('revisjon', 'Revisjon', 'Revisjonsmetodikk, standarder og prosedyrer', 'subject_area', 10, '#8B5CF6', ARRAY['planning', 'execution', 'completion'], ARRAY['ISA 200'], 'medium'),
('regnskap', 'Regnskap', 'Regnskapsstandarder og -regler', 'subject_area', 20, '#10B981', ARRAY['planning', 'execution'], ARRAY[], 'medium'),
('skatt', 'Skatt', 'Skattelover og -regler', 'subject_area', 30, '#F59E0B', ARRAY['execution', 'completion'], ARRAY[], 'medium'),
('juridisk', 'Juridisk', 'Lover, forskrifter og rettsavgjørelser', 'subject_area', 40, '#EF4444', ARRAY['planning'], ARRAY[], 'high'),
('internkontroll', 'Internkontroll', 'Internkontroll og risikostyring', 'subject_area', 50, '#6366F1', ARRAY['planning', 'execution'], ARRAY['ISA 315', 'ISA 330'], 'high'),

-- Spesifikke revisjonsområder
('inntekter', 'Inntekter og salg', 'Inntektsføring og salgsrelaterte prosesser', 'subject_area', 110, '#059669', ARRAY['execution'], ARRAY['ISA 315', 'ISA 330', 'ISA 500'], 'high'),
('varelager', 'Varelager', 'Lager og varebeholdning', 'subject_area', 120, '#0891B2', ARRAY['execution'], ARRAY['ISA 501'], 'medium'),
('anleggsmidler', 'Anleggsmidler', 'Anleggsmidler og avskrivninger', 'subject_area', 130, '#7C3AED', ARRAY['execution'], ARRAY['ISA 540'], 'medium'),
('gjeld', 'Gjeld og forpliktelser', 'Leverandørgjeld og øvrig gjeld', 'subject_area', 140, '#DC2626', ARRAY['execution'], ARRAY['ISA 500'], 'medium'),
('egenkapital', 'Egenkapital', 'Egenkapital og eierforhold', 'subject_area', 150, '#16A34A', ARRAY['execution'], ARRAY[], 'low'),
('lonn', 'Lønn og personal', 'Lønn og personalrelaterte kostnader', 'subject_area', 160, '#EA580C', ARRAY['execution'], ARRAY['ISA 315'], 'high'),

-- Prosessområder
('planlegging', 'Revisjonsplanlegging', 'Planlegging og risikovurdering', 'process', 210, '#8B5CF6', ARRAY['planning'], ARRAY['ISA 300', 'ISA 315'], 'high'),
('utforelse', 'Revisjonsutførelse', 'Gjennomføring av revisjonshandlinger', 'process', 220, '#10B981', ARRAY['execution'], ARRAY['ISA 330', 'ISA 500'], 'high'),
('rapportering', 'Revisjonsrapportering', 'Rapportering og konklusjoner', 'process', 230, '#F59E0B', ARRAY['completion'], ARRAY['ISA 700', 'ISA 705'], 'high'),
('dokumentasjon', 'Revisjonsdokumentasjon', 'Dokumentasjon av revisjonsarbeid', 'process', 240, '#6B7280', ARRAY['planning', 'execution', 'completion'], ARRAY['ISA 230'], 'medium'),

-- Compliance/regelverksområder
('hvitvasking', 'Hvitvasking', 'Hvitvaskingsregler og -kontroll', 'compliance', 310, '#EF4444', ARRAY['planning', 'execution'], ARRAY[], 'high'),
('baerekraft', 'Bærekraft', 'Bærekraftsrapportering og ESG', 'compliance', 320, '#059669', ARRAY['planning', 'execution'], ARRAY[], 'medium'),
('finanstilsyn', 'Finanstilsyn', 'Finanstilsynets regler og veiledninger', 'compliance', 330, '#7C3AED', ARRAY['planning'], ARRAY[], 'high');

-- 3. Forbedre content_types for norsk revisjon
DELETE FROM content_types WHERE name IN ('sjekkliste', 'veiledning', 'Rundskriv');

INSERT INTO content_types (name, display_name, description, color, sort_order) VALUES
('prosedyre', 'Prosedyre', 'Detaljerte revisjonshandlinger og prosedyrer', '#adcc3e', 10),
('sjekkliste', 'Sjekkliste', 'Strukturerte sjekklister for revisjonsarbeid', '#EF4444', 11),
('metodikk', 'Metodikk', 'Revisjonsmetodikk og fremgangsmåter', '#8B5CF6', 12),
('rundskriv', 'Rundskriv', 'Rundskriv fra myndigheter', '#6B7280', 13)
ON CONFLICT (name) DO UPDATE SET
display_name = EXCLUDED.display_name,
description = EXCLUDED.description,
color = EXCLUDED.color,
sort_order = EXCLUDED.sort_order;

-- 4. Opprett mapping-tabell for artikler
CREATE TABLE IF NOT EXISTS article_unified_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL,
    unified_category_id UUID NOT NULL REFERENCES unified_categories(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 1.0, -- hvor relevant kategorien er for artikkelen
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(article_id, unified_category_id)
);

-- RLS for mapping
ALTER TABLE article_unified_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view article category mappings" ON article_unified_categories
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage article category mappings" ON article_unified_categories
FOR ALL USING (auth.role() = 'authenticated');

-- 5. Automatisk migrate eksisterende data
-- Migrer fra subject_areas
INSERT INTO article_unified_categories (article_id, unified_category_id, relevance_score)
SELECT 
    asa.article_id,
    uc.id as unified_category_id,
    1.0
FROM article_subject_areas asa
JOIN subject_areas sa ON asa.subject_area_id = sa.id
JOIN unified_categories uc ON LOWER(TRIM(sa.name)) = LOWER(TRIM(uc.name))
ON CONFLICT (article_id, unified_category_id) DO NOTHING;

-- 6. Opprett trigger for automatisk oppdatering av updated_at
CREATE OR REPLACE FUNCTION update_unified_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unified_categories_updated_at_trigger
    BEFORE UPDATE ON unified_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_unified_categories_updated_at();