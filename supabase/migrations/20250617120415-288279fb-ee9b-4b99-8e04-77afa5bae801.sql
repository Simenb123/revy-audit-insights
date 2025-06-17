
-- Step 1: Create the "Annet" main category if it doesn't exist
INSERT INTO public.knowledge_categories (name, description, icon, display_order, parent_category_id)
VALUES ('Annet', 'Øvrige fagområder inkludert risikostyring, internkontroll og juridiske tekster', 'folder', 4, NULL)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create "Revisjon" main category if it doesn't exist
INSERT INTO public.knowledge_categories (name, description, icon, display_order, parent_category_id)
VALUES ('Revisjon', 'Revisjonsstandarder, metodikk og prosedyrer', 'shield-check', 1, NULL)
ON CONFLICT (name) DO NOTHING;

-- Step 3: Create "Skatt" main category if it doesn't exist
INSERT INTO public.knowledge_categories (name, description, icon, display_order, parent_category_id)
VALUES ('Skatt', 'Skattelover, regler og veiledning', 'calculator', 3, NULL)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Update existing "Regnskap" category to have correct properties
UPDATE public.knowledge_categories 
SET 
    description = 'Regnskapsstandarder, regler og veiledning',
    icon = 'calculator',
    display_order = 2,
    parent_category_id = NULL
WHERE name = 'Regnskap';

-- Step 5: Update "Revisjon" category properties if it exists
UPDATE public.knowledge_categories 
SET 
    description = 'Revisjonsstandarder, metodikk og prosedyrer',
    icon = 'shield-check',
    display_order = 1,
    parent_category_id = NULL
WHERE name = 'Revisjon';

-- Step 6: Move articles from "Regnskapsstandarder" to "Regnskap" before deleting
UPDATE public.knowledge_articles 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Regnskap' AND parent_category_id IS NULL)
WHERE category_id IN (
    SELECT id FROM public.knowledge_categories 
    WHERE name = 'Regnskapsstandarder' AND parent_category_id IS NULL
);

-- Step 7: Move articles from "Revisjonshandlinger" to "Revisjon"
UPDATE public.knowledge_articles 
SET category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)
WHERE category_id IN (
    SELECT id FROM public.knowledge_categories 
    WHERE name = 'Revisjonshandlinger' AND parent_category_id IS NULL
);

-- Step 8: Delete duplicate main categories after moving articles
DELETE FROM public.knowledge_categories 
WHERE name = 'Regnskapsstandarder' AND parent_category_id IS NULL;

DELETE FROM public.knowledge_categories 
WHERE name = 'Revisjonshandlinger' AND parent_category_id IS NULL;

DELETE FROM public.knowledge_categories 
WHERE name = 'Jus' AND parent_category_id IS NULL;

-- Step 9: Move "Lover og Forskrifter" to be under "Annet"
UPDATE public.knowledge_categories 
SET parent_category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Annet' AND parent_category_id IS NULL)
WHERE name = 'Lover og Forskrifter';

-- Step 10: Update "Revisjonsstandarder" to be under "Revisjon" if it exists as subcategory
UPDATE public.knowledge_categories 
SET parent_category_id = (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)
WHERE name = 'Revisjonsstandarder' AND parent_category_id IS NOT NULL;

-- Step 11: Create "Fagartikler" as subcategories under relevant main areas
INSERT INTO public.knowledge_categories (name, description, icon, display_order, parent_category_id)
VALUES 
('Fagartikler - Revisjon', 'Fagartikler om revisjon', 'file-text', 10, (SELECT id FROM public.knowledge_categories WHERE name = 'Revisjon' AND parent_category_id IS NULL)),
('Fagartikler - Regnskap', 'Fagartikler om regnskap', 'file-text', 10, (SELECT id FROM public.knowledge_categories WHERE name = 'Regnskap' AND parent_category_id IS NULL)),
('Fagartikler - Skatt', 'Fagartikler om skatt', 'file-text', 10, (SELECT id FROM public.knowledge_categories WHERE name = 'Skatt' AND parent_category_id IS NULL))
ON CONFLICT (name) DO NOTHING;
