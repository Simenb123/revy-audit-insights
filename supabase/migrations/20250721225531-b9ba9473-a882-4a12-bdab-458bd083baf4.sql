
-- Først, la oss identifisere og fjerne duplikater i subject_areas tabellen
-- Vi beholder den med lavest ID og sletter resten

-- Lag en temporary tabell for å identifisere duplikater
CREATE TEMPORARY TABLE subject_area_duplicates AS
SELECT 
    name,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids
FROM subject_areas 
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- Oppdater referanser til duplikater før sletting
UPDATE article_subject_areas 
SET subject_area_id = (
    SELECT keep_id 
    FROM subject_area_duplicates 
    WHERE subject_area_id = ANY(all_ids)
)
WHERE subject_area_id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM subject_area_duplicates
);

UPDATE audit_action_subject_areas 
SET subject_area_id = (
    SELECT keep_id 
    FROM subject_area_duplicates 
    WHERE subject_area_id = ANY(all_ids)
)
WHERE subject_area_id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM subject_area_duplicates
);

UPDATE document_type_subject_areas 
SET subject_area_id = (
    SELECT keep_id 
    FROM subject_area_duplicates 
    WHERE subject_area_id = ANY(all_ids)
)
WHERE subject_area_id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM subject_area_duplicates
);

-- Slett duplikater (beholder kun den med lavest ID)
DELETE FROM subject_areas 
WHERE id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM subject_area_duplicates
);

-- Standardiser navnekonvensjoner - trim whitespace og fiks case
UPDATE subject_areas 
SET 
    name = TRIM(name),
    display_name = TRIM(display_name),
    description = TRIM(description)
WHERE name != TRIM(name) 
   OR display_name != TRIM(display_name) 
   OR (description IS NOT NULL AND description != TRIM(description));

-- Legg til constraint for å forhindre fremtidige duplikater
ALTER TABLE subject_areas 
ADD CONSTRAINT unique_subject_area_name 
UNIQUE (name);

-- Gjør det samme for content_types
CREATE TEMPORARY TABLE content_type_duplicates AS
SELECT 
    name,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids
FROM content_types 
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- Oppdater referanser for content_types
UPDATE knowledge_articles 
SET content_type_id = (
    SELECT keep_id 
    FROM content_type_duplicates 
    WHERE content_type_id = ANY(all_ids)
)
WHERE content_type_id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM content_type_duplicates
);

-- Slett duplikater i content_types
DELETE FROM content_types 
WHERE id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM content_type_duplicates
);

-- Standardiser content_types
UPDATE content_types 
SET 
    name = TRIM(name),
    display_name = TRIM(display_name),
    description = TRIM(description)
WHERE name != TRIM(name) 
   OR display_name != TRIM(display_name) 
   OR (description IS NOT NULL AND description != TRIM(description));

-- Legg til constraint for content_types
ALTER TABLE content_types 
ADD CONSTRAINT unique_content_type_name 
UNIQUE (name);

-- Gjør det samme for tags
CREATE TEMPORARY TABLE tag_duplicates AS
SELECT 
    name,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids
FROM tags 
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- Oppdater referanser for tags
UPDATE knowledge_article_tags 
SET tag_id = (
    SELECT keep_id 
    FROM tag_duplicates 
    WHERE tag_id = ANY(all_ids)
)
WHERE tag_id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM tag_duplicates
);

UPDATE audit_action_tags 
SET tag_id = (
    SELECT keep_id 
    FROM tag_duplicates 
    WHERE tag_id = ANY(all_ids)
)
WHERE tag_id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM tag_duplicates
);

-- Slett duplikater i tags
DELETE FROM tags 
WHERE id IN (
    SELECT UNNEST(all_ids[2:]) 
    FROM tag_duplicates
);

-- Standardiser tags
UPDATE tags 
SET 
    name = TRIM(name),
    display_name = TRIM(display_name),
    description = TRIM(description)
WHERE name != TRIM(name) 
   OR display_name != TRIM(display_name) 
   OR (description IS NOT NULL AND description != TRIM(description));

-- Legg til constraint for tags
ALTER TABLE tags 
ADD CONSTRAINT unique_tag_name 
UNIQUE (name);

-- Opprett en admin_logs tabell for å spore endringer
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin logs" ON admin_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_role = 'admin'
    )
);

CREATE POLICY "System can insert admin logs" ON admin_logs
FOR INSERT WITH CHECK (true);
