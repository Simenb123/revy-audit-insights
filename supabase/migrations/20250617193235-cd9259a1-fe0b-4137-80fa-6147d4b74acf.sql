
-- Fix the error and add database support for content types and subject areas
CREATE TABLE public.content_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.subject_areas (
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

CREATE TABLE public.article_subject_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  subject_area_id UUID NOT NULL REFERENCES public.subject_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, subject_area_id)
);

-- Add content_type_id to knowledge_articles
ALTER TABLE public.knowledge_articles 
ADD COLUMN content_type_id UUID REFERENCES public.content_types(id);

-- Enable RLS
ALTER TABLE public.content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_subject_areas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all authenticated users to read, only admins to modify)
CREATE POLICY "Everyone can view content types" ON public.content_types FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage content types" ON public.content_types FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view subject areas" ON public.subject_areas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage subject areas" ON public.subject_areas FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view article subject areas" ON public.article_subject_areas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage article subject areas" ON public.article_subject_areas FOR ALL USING (auth.role() = 'authenticated');

-- Insert default content types
INSERT INTO public.content_types (name, display_name, description, icon, color, sort_order) VALUES
('fagartikkel', 'Fagartikkel', 'Generelle fagartikler og veiledninger', 'file-text', '#3B82F6', 1),
('lov', 'Lov', 'Lovtekster og juridiske dokumenter', 'scale', '#10B981', 2),
('isa-standard', 'ISA-standard', 'International Standards on Auditing', 'file-code', '#8B5CF6', 3),
('nrs-standard', 'NRS-standard', 'Norske Revisjons Standarder', 'book', '#6366F1', 4),
('forskrift', 'Forskrift', 'Forskrifter og reglementer', 'gavel', '#F59E0B', 5),
('forarbeider', 'Forarbeider', 'Forarbeider og proposisjoner', 'file-text', '#6B7280', 6),
('dom', 'Dom', 'Rettsavgjørelser og dommer', 'scale', '#EF4444', 7),
('revisjonshandlinger', 'Revisjonshandlinger', 'Praktiske revisjonshandlinger og prosedyrer', 'list-checks', '#059669', 8);

-- Insert default subject areas
INSERT INTO public.subject_areas (name, display_name, description, icon, color, sort_order) VALUES
('revisjon', 'Revisjon', 'Generell revisjonsteori og metodikk', 'shield-check', '#3B82F6', 1),
('regnskap', 'Regnskap', 'Regnskapsstandarder og regnskapsregler', 'calculator', '#10B981', 2),
('skatt', 'Skatt', 'Skattelover, regler og veiledning', 'coins', '#F59E0B', 3),
('inntekter', 'Inntekter/Salg', 'Revisjonshandlinger for inntektsføring og salg', 'trending-up', '#059669', 5),
('lonn', 'Lønn', 'Revisjonshandlinger for lønn og personalutgifter', 'users', '#7C3AED', 6),
('andre-driftskostnader', 'Andre driftskostnader', 'Revisjonshandlinger for øvrige driftskostnader', 'receipt', '#DC2626', 7),
('varelager', 'Varelager', 'Revisjonshandlinger for varelager og lagerføring', 'package', '#EA580C', 8),
('banktransaksjoner', 'Banktransaksjoner', 'Revisjonshandlinger for bank og kontanter', 'banknote', '#0891B2', 9),
('investeringer', 'Investeringer/Anleggsmidler', 'Revisjonshandlinger for anleggsmidler og investeringer', 'building', '#9333EA', 10),
('kundefordringer', 'Kundefordringer', 'Revisjonshandlinger for kundefordringer og nedskrivninger', 'user-check', '#16A34A', 11),
('leverandorgjeld', 'Leverandørgjeld', 'Revisjonshandlinger for leverandørgjeld og påløpte kostnader', 'credit-card', '#DB2777', 12),
('egenkapital', 'Egenkapital', 'Revisjonshandlinger for egenkapital og utbytte', 'pie-chart', '#7C2D12', 13),
('naerstaaende', 'Nærstående transaksjoner', 'Revisjonshandlinger for nærstående parter og transaksjoner', 'link', '#BE185D', 14),
('annet', 'Annet', 'Øvrige fagområder og tverrgående temaer', 'folder', '#6B7280', 15);

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_content_types
  BEFORE UPDATE ON public.content_types
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_subject_areas
  BEFORE UPDATE ON public.subject_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
