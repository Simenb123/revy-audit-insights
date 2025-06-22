
-- Create missing linking tables and improve existing structure (updated version)

-- 1. Create content_types table for better content type management
CREATE TABLE IF NOT EXISTS public.content_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT NOT NULL DEFAULT '#10B981',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Add content_type_id to knowledge_articles to link with content_types
ALTER TABLE public.knowledge_articles 
ADD COLUMN IF NOT EXISTS content_type_id UUID REFERENCES public.content_types(id);

-- 3. Create audit_action_subject_areas linking table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.audit_action_subject_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE,
  subject_area_id UUID REFERENCES public.subject_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_template_id, subject_area_id)
);

-- 4. Create document_type_subject_areas linking table
CREATE TABLE IF NOT EXISTS public.document_type_subject_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type_id UUID REFERENCES public.document_types(id) ON DELETE CASCADE,
  subject_area_id UUID REFERENCES public.subject_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_type_id, subject_area_id)
);

-- 5. Create standardized tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6B7280',
  category TEXT, -- e.g., 'isa-standard', 'risk-level', 'audit-phase'
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create knowledge_article_tags linking table to replace array-based tags
CREATE TABLE IF NOT EXISTS public.knowledge_article_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, tag_id)
);

-- 7. Create audit_action_tags linking table
CREATE TABLE IF NOT EXISTS public.audit_action_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_template_id, tag_id)
);

-- 8. Insert default content types
INSERT INTO public.content_types (name, display_name, description, icon, color, sort_order) VALUES
('fagartikkel', 'Fagartikkel', 'Generelle fagartikler og veiledninger', 'book-open', '#10B981', 1),
('isa-standard', 'ISA Standard', 'International Standards on Auditing', 'shield-check', '#3B82F6', 2),
('nrs-standard', 'NRS Standard', 'Norske Revisjons Standarder', 'flag', '#8B5CF6', 3),
('lov', 'Lov', 'Lover og juridiske tekster', 'scale', '#EF4444', 4),
('forskrift', 'Forskrift', 'Forskrifter og reguleringer', 'file-text', '#F59E0B', 5),
('forarbeider', 'Forarbeider', 'Lovforarbeider og proposisjoner', 'file-stack', '#6B7280', 6),
('dom', 'Dom', 'Rettsavgjørelser og dommer', 'gavel', '#EC4899', 7),
('revisjonshandlinger', 'Revisjonshandlinger', 'Praktiske revisjonshandlinger', 'clipboard-check', '#14B8A6', 8)
ON CONFLICT (name) DO NOTHING;

-- 9. Insert default tags for common categories
INSERT INTO public.tags (name, display_name, category, color, sort_order) VALUES
-- ISA Standards
('isa-200', 'ISA 200', 'isa-standard', '#3B82F6', 1),
('isa-315', 'ISA 315', 'isa-standard', '#3B82F6', 2),
('isa-330', 'ISA 330', 'isa-standard', '#3B82F6', 3),
('isa-500', 'ISA 500', 'isa-standard', '#3B82F6', 4),
('isa-540', 'ISA 540', 'isa-standard', '#3B82F6', 5),

-- Risk Levels
('high-risk', 'Høy risiko', 'risk-level', '#EF4444', 10),
('medium-risk', 'Middels risiko', 'risk-level', '#F59E0B', 11),
('low-risk', 'Lav risiko', 'risk-level', '#10B981', 12),

-- Audit Phases
('planning', 'Planlegging', 'audit-phase', '#8B5CF6', 20),
('execution', 'Gjennomføring', 'audit-phase', '#10B981', 21),
('completion', 'Avslutning', 'audit-phase', '#F59E0B', 22)
ON CONFLICT (name) DO NOTHING;

-- 10. Enable RLS on new tables (only if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'content_types' AND relrowsecurity = true) THEN
    ALTER TABLE public.content_types ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'audit_action_subject_areas' AND relrowsecurity = true) THEN
    ALTER TABLE public.audit_action_subject_areas ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'document_type_subject_areas' AND relrowsecurity = true) THEN
    ALTER TABLE public.document_type_subject_areas ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'tags' AND relrowsecurity = true) THEN
    ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'knowledge_article_tags' AND relrowsecurity = true) THEN
    ALTER TABLE public.knowledge_article_tags ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'audit_action_tags' AND relrowsecurity = true) THEN
    ALTER TABLE public.audit_action_tags ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 11. Create RLS policies (drop first if they exist, then recreate)
DO $$ 
BEGIN
  -- Content types policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_types' AND policyname = 'Content types are publicly readable') THEN
    DROP POLICY "Content types are publicly readable" ON public.content_types;
  END IF;
  CREATE POLICY "Content types are publicly readable" ON public.content_types FOR SELECT USING (true);

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_types' AND policyname = 'Authenticated users can manage content types') THEN
    DROP POLICY "Authenticated users can manage content types" ON public.content_types;
  END IF;
  CREATE POLICY "Authenticated users can manage content types" ON public.content_types FOR ALL USING (auth.role() = 'authenticated');

  -- Tags policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Tags are publicly readable') THEN
    DROP POLICY "Tags are publicly readable" ON public.tags;
  END IF;
  CREATE POLICY "Tags are publicly readable" ON public.tags FOR SELECT USING (true);

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Authenticated users can manage tags') THEN
    DROP POLICY "Authenticated users can manage tags" ON public.tags;
  END IF;
  CREATE POLICY "Authenticated users can manage tags" ON public.tags FOR ALL USING (auth.role() = 'authenticated');

END $$;

-- Create policies for new linking tables
CREATE POLICY "Subject area mappings are publicly readable" ON public.audit_action_subject_areas FOR SELECT USING (true);
CREATE POLICY "Document type mappings are publicly readable" ON public.document_type_subject_areas FOR SELECT USING (true);
CREATE POLICY "Article tags are publicly readable" ON public.knowledge_article_tags FOR SELECT USING (true);
CREATE POLICY "Action tags are publicly readable" ON public.audit_action_tags FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage subject area mappings" ON public.audit_action_subject_areas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage document type mappings" ON public.document_type_subject_areas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage article tags" ON public.knowledge_article_tags FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage action tags" ON public.audit_action_tags FOR ALL USING (auth.role() = 'authenticated');

-- 12. Create updated_at triggers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_content_types') THEN
    CREATE TRIGGER set_updated_at_content_types
      BEFORE UPDATE ON public.content_types
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_tags') THEN
    CREATE TRIGGER set_updated_at_tags
      BEFORE UPDATE ON public.tags
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
