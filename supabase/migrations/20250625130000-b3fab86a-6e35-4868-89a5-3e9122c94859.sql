-- Add slug column to knowledge_categories
ALTER TABLE public.knowledge_categories
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Populate slug with slugified name
UPDATE public.knowledge_categories
SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL;

-- Make slug not null and unique
ALTER TABLE public.knowledge_categories
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.knowledge_categories
ADD CONSTRAINT knowledge_categories_slug_key UNIQUE (slug);
