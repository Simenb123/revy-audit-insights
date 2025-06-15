
UPDATE knowledge_articles
SET 
  status = 'published', 
  published_at = COALESCE(published_at, now())
WHERE title = 'ISA 210 - må krav' AND status = 'archived';
