-- Legal Knowledge Structure Implementation
-- Phase 1: Core legal document structure

-- Legal document types with hierarchy
CREATE TABLE public.legal_document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  hierarchy_level INTEGER NOT NULL DEFAULT 1, -- 1=primary (laws), 2=secondary (regulations), 3=tertiary (articles)
  authority_weight NUMERIC DEFAULT 1.0, -- For AI ranking (laws=1.0, regulations=0.8, articles=0.5)
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legal provisions (laws, chapters, paragraphs, sections)
CREATE TABLE public.legal_provisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provision_type TEXT NOT NULL, -- 'law', 'chapter', 'section', 'paragraph', 'subsection', 'point'
  provision_number TEXT NOT NULL, -- e.g., "3", "3-1", "3-1-a"
  title TEXT NOT NULL,
  content TEXT,
  parent_provision_id UUID REFERENCES public.legal_provisions(id),
  law_identifier TEXT NOT NULL, -- e.g., "regnskapsloven", "revisorloven"
  law_full_name TEXT, -- e.g., "Lov om årsregnskap m.v."
  valid_from DATE,
  valid_until DATE,
  hierarchy_path TEXT, -- e.g., "regnskapsloven.kap1.§3.ledd1"
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced legal documents table
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  document_type_id UUID REFERENCES public.legal_document_types(id),
  document_number TEXT, -- e.g., "LOV-1998-07-17-56"
  content TEXT NOT NULL,
  summary TEXT,
  publication_date DATE,
  effective_date DATE,
  expiry_date DATE,
  issuing_authority TEXT, -- e.g., "Stortinget", "Regjeringen", "Høyesterett"
  source_url TEXT,
  document_status TEXT DEFAULT 'active', -- active, superseded, repealed
  is_primary_source BOOLEAN DEFAULT false,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Provision-Document relationships
CREATE TABLE public.provision_document_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provision_id UUID REFERENCES public.legal_provisions(id),
  document_id UUID REFERENCES public.legal_documents(id),
  relation_type TEXT NOT NULL, -- 'explains', 'interprets', 'cites', 'supersedes', 'implements'
  relevance_score NUMERIC DEFAULT 1.0,
  context_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provision_id, document_id, relation_type)
);

-- Document cross-references
CREATE TABLE public.document_cross_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_document_id UUID REFERENCES public.legal_documents(id),
  target_document_id UUID REFERENCES public.legal_documents(id),
  reference_type TEXT NOT NULL, -- 'cites', 'relies_on', 'conflicts_with', 'updates'
  reference_text TEXT, -- Original reference text found in document
  confidence_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_document_id, target_document_id, reference_type)
);

-- Legal citations and references found in text
CREATE TABLE public.legal_citations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.legal_documents(id),
  provision_id UUID REFERENCES public.legal_provisions(id),
  citation_text TEXT NOT NULL, -- e.g., "regnskapsloven § 3-1"
  citation_context TEXT, -- Surrounding text for context
  position_start INTEGER, -- Character position in document
  position_end INTEGER,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced subject area mappings for legal context
CREATE TABLE public.legal_subject_area_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provision_id UUID REFERENCES public.legal_provisions(id),
  document_id UUID REFERENCES public.legal_documents(id),
  subject_area_id UUID REFERENCES public.subject_areas(id),
  relevance_level TEXT DEFAULT 'primary', -- primary, secondary, tangential
  confidence_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_legal_provisions_hierarchy ON public.legal_provisions(law_identifier, provision_type, provision_number);
CREATE INDEX idx_legal_provisions_parent ON public.legal_provisions(parent_provision_id);
CREATE INDEX idx_legal_documents_type ON public.legal_documents(document_type_id);
CREATE INDEX idx_legal_documents_date ON public.legal_documents(publication_date, effective_date);
CREATE INDEX idx_provision_document_relations_provision ON public.provision_document_relations(provision_id);
CREATE INDEX idx_provision_document_relations_document ON public.provision_document_relations(document_id);
CREATE INDEX idx_document_cross_references_source ON public.document_cross_references(source_document_id);
CREATE INDEX idx_legal_citations_document ON public.legal_citations(document_id);
CREATE INDEX idx_legal_citations_provision ON public.legal_citations(provision_id);

-- Create triggers for updated_at
CREATE TRIGGER update_legal_document_types_updated_at
  BEFORE UPDATE ON public.legal_document_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_provisions_updated_at
  BEFORE UPDATE ON public.legal_provisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert basic legal document types
INSERT INTO public.legal_document_types (name, display_name, description, hierarchy_level, authority_weight) VALUES
('lov', 'Lov', 'Lover vedtatt av Stortinget', 1, 1.0),
('forskrift', 'Forskrift', 'Forskrifter og regelverk', 2, 0.9),
('rundskriv', 'Rundskriv', 'Rundskriv fra myndigheter', 2, 0.8),
('dom', 'Dom', 'Rettsavgjørelser', 2, 0.8),
('forarbeid', 'Forarbeid', 'Proposisjoner og forarbeider', 2, 0.7),
('fagartikkel', 'Fagartikkel', 'Faglige artikler og kommentarer', 3, 0.5),
('lovkommentar', 'Lovkommentar', 'Juridiske kommentarer til lovbestemmelser', 3, 0.6),
('standard', 'Standard', 'Tekniske og faglige standarder', 3, 0.6);

-- Enable RLS
ALTER TABLE public.legal_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provision_document_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_cross_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_subject_area_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view legal document types" ON public.legal_document_types FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage legal document types" ON public.legal_document_types FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view legal provisions" ON public.legal_provisions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage legal provisions" ON public.legal_provisions FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view legal documents" ON public.legal_documents FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage legal documents" ON public.legal_documents FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view provision document relations" ON public.provision_document_relations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage provision document relations" ON public.provision_document_relations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view document cross references" ON public.document_cross_references FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage document cross references" ON public.document_cross_references FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view legal citations" ON public.legal_citations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage legal citations" ON public.legal_citations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view legal subject area mappings" ON public.legal_subject_area_mappings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage legal subject area mappings" ON public.legal_subject_area_mappings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');