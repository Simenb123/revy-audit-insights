
-- Step 1: Add content_type column to knowledge_articles table
ALTER TABLE public.knowledge_articles 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'fagartikkel';

-- Step 2: Update existing articles with appropriate content_types based on reference_code and title
UPDATE public.knowledge_articles 
SET content_type = CASE 
    WHEN reference_code ILIKE 'isa%' OR title ILIKE '%isa%' THEN 'isa-standard'
    WHEN reference_code ILIKE 'nrs%' OR title ILIKE '%nrs%' THEN 'nrs-standard'
    WHEN title ILIKE '%lov%' OR title ILIKE '%loven%' OR reference_code ILIKE '%lov%' THEN 'lov'
    WHEN title ILIKE '%forskrift%' OR reference_code ILIKE '%forskrift%' THEN 'forskrift'
    WHEN title ILIKE '%forarbeider%' OR title ILIKE '%proposisjon%' OR title ILIKE '%innstilling%' THEN 'forarbeider'
    ELSE 'fagartikkel'
END;

-- Step 3: Restructure categories - First create the 4 main categories if they don't exist
INSERT INTO public.knowledge_categories (name, description, icon, display_order, parent_category_id)
VALUES 
    ('Revisjon', 'Revisjonsstandarder, metodikk og prosedyrer', 'shield-check', 1, NULL),
    ('Regnskap', 'Regnskapsstandarder, regler og veiledning', 'calculator', 2, NULL),
    ('Skatt', 'Skattelover, regler og veiledning', 'coins', 3, NULL),
    ('Annet', 'Øvrige fagområder inkludert risikostyring, internkontroll og juridiske tekster', 'folder', 4, NULL)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    display_order = EXCLUDED.display_order,
    parent_category_id = EXCLUDED.parent_category_id;

-- Step 4: Create content type specific subcategories under each main category
INSERT INTO public.knowledge_categories (name, description, icon, display_order, parent_category_id)
VALUES 
    ('ISA-standarder', 'International Standards on Auditing', 'file-code', 1, (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)),
    ('NRS-standarder', 'Norske Revisjons Standarder', 'book', 2, (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)),
    ('Lover', 'Lovtekster og juridiske dokumenter', 'scale', 1, (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)),
    ('Forskrifter', 'Forskrifter og reglementer', 'gavel', 2, (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)),
    ('Fagartikler', 'Generelle fagartikler', 'file-text', 10, (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL))
ON CONFLICT (name) DO NOTHING;

-- Step 5: Update articles to be in appropriate categories based on content_type
UPDATE public.knowledge_articles 
SET category_id = COALESCE(
    (SELECT id FROM public.knowledge_categories 
     WHERE name = 'ISA-standarder' 
     AND parent_category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)),
    (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)
)
WHERE content_type = 'isa-standard';

UPDATE public.knowledge_articles 
SET category_id = COALESCE(
    (SELECT id FROM public.knowledge_categories 
     WHERE name = 'NRS-standarder' 
     AND parent_category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)),
    (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)
)
WHERE content_type = 'nrs-standard';

UPDATE public.knowledge_articles 
SET category_id = COALESCE(
    (SELECT id FROM public.knowledge_categories 
     WHERE name = 'Lover' 
     AND parent_category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)),
    (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)
)
WHERE content_type = 'lov';

UPDATE public.knowledge_articles 
SET category_id = COALESCE(
    (SELECT id FROM public.knowledge_categories 
     WHERE name = 'Forskrifter' 
     AND parent_category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)),
    (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)
)
WHERE content_type = 'forskrift';

UPDATE public.knowledge_articles 
SET category_id = COALESCE(
    (SELECT id FROM public.knowledge_categories 
     WHERE name = 'Fagartikler' 
     AND parent_category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)),
    (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)
)
WHERE content_type = 'forarbeider';
