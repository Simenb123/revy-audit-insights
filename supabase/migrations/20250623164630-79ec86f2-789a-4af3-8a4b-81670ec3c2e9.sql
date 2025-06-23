
-- Fase 1: Migrering og opprydding av knowledge_articles

-- 1. Legg til manglende innholdstyper
INSERT INTO public.content_types (name, display_name, description, icon, color, sort_order) VALUES
('hvitvasking', 'Hvitvasking', 'Dokumenter og artikler om hvitvaskingsregler og -kontroll', 'shield-alert', '#DC2626', 9)
ON CONFLICT (name) DO NOTHING;

-- 2. Migrer content_type verdier til content_type_id
UPDATE public.knowledge_articles 
SET content_type_id = ct.id
FROM public.content_types ct
WHERE knowledge_articles.content_type = ct.name
  AND knowledge_articles.content_type_id IS NULL;

-- 3. Migrer tags fra array til knowledge_article_tags tabell
INSERT INTO public.knowledge_article_tags (article_id, tag_id)
SELECT 
  ka.id as article_id,
  t.id as tag_id
FROM public.knowledge_articles ka
CROSS JOIN unnest(ka.tags) as tag_name
JOIN public.tags t ON t.name = tag_name
ON CONFLICT (article_id, tag_id) DO NOTHING;

-- 4. Sett default content_type_id for artikler som fortsatt mangler det
UPDATE public.knowledge_articles 
SET content_type_id = (
  SELECT id FROM public.content_types WHERE name = 'fagartikkel' LIMIT 1
)
WHERE content_type_id IS NULL;

-- 5. Fjern de gamle kolonnene etter migrering
ALTER TABLE public.knowledge_articles DROP COLUMN IF EXISTS content_type;
ALTER TABLE public.knowledge_articles DROP COLUMN IF EXISTS tags;

-- 6. Gjør content_type_id obligatorisk
ALTER TABLE public.knowledge_articles ALTER COLUMN content_type_id SET NOT NULL;

-- 7. Oppdater subject_areas med hierarkisk struktur
INSERT INTO public.subject_areas (name, display_name, description, icon, color, sort_order) VALUES
('revisjon', 'Revisjon', 'Revisjonsrelaterte emner og standarder', 'search-check', '#3B82F6', 1),
('regnskap', 'Regnskap', 'Regnskapsrelaterte emner og standarder', 'calculator', '#059669', 2),
('skatt', 'Skatt', 'Skatterelaterte emner og regler', 'receipt', '#DC2626', 3),
('bokforing', 'Bokføring', 'Bokføringsrelaterte emner', 'book-open-check', '#7C3AED', 4),
('hvitvasking', 'Hvitvasking', 'Hvitvaskingsrelaterte emner og kontroller', 'shield-alert', '#DC2626', 5)
ON CONFLICT (name) DO NOTHING;
