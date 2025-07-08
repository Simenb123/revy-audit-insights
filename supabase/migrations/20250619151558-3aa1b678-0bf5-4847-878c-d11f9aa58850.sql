
-- Add AI context variants and subject area mappings
ALTER TABLE client_documents_files 
ADD COLUMN ai_suggested_subject_areas TEXT[] DEFAULT NULL,
ADD COLUMN ai_revision_phase_relevance JSONB DEFAULT NULL,
ADD COLUMN ai_isa_standard_references TEXT[] DEFAULT NULL;

-- Create table for AI-Revy variants/modes
CREATE TABLE ai_revy_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  system_prompt_template TEXT NOT NULL,
  context_requirements JSONB DEFAULT '{}',
  available_contexts TEXT[] DEFAULT ARRAY['general'],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mapping between document categories and audit action subject areas
CREATE TABLE document_category_subject_area_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_category_id UUID REFERENCES document_categories(id),
  subject_area TEXT NOT NULL,
  isa_standards TEXT[] DEFAULT NULL,
  audit_phases TEXT[] DEFAULT NULL,
  risk_level TEXT DEFAULT 'medium',
  confidence_score NUMERIC DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default AI-Revy variants
INSERT INTO ai_revy_variants (name, display_name, description, system_prompt_template, available_contexts, sort_order) VALUES
('methodology', 'AI-Revy Metodikk', 'Spesialisert på revisjonsmetodikk og ISA-standarder', 
 'Du er AI-Revy Metodikk, ekspert på revisjonsmetodikk og ISA-standarder. Du hjelper med planlegging, utførelse og dokumentasjon av revisjonshandlinger i henhold til gjeldende standarder.', 
 ARRAY['planning', 'execution', 'completion', 'audit-actions'], 1),
 
('professional', 'AI-Revy Faglig', 'Faglig støtte innen regnskapslovgivning og bransjeforhold', 
 'Du er AI-Revy Faglig, ekspert på norsk regnskapslovgivning, IFRS, og bransjespecifikke forhold. Du gir faglig veiledning og tolkning av regnskapsstandarder.', 
 ARRAY['general', 'client-detail', 'risk-assessment', 'documentation'], 2),
 
('guide', 'AI-Revy Veileder', 'Veiledende hjelp for nye medarbeidere og opplæring', 
 'Du er AI-Revy Veileder, som hjelper nye medarbeidere med å forstå revisjonsarbeid. Du gir pedagogiske forklaringer og praktiske tips.', 
 ARRAY['general', 'collaboration', 'client-detail'], 3),
 
('support', 'AI-Revy Support', 'Teknisk support og systemhjelp', 
 'Du er AI-Revy Support, som hjelper med tekniske spørsmål om systemet, dokumentopplasting, og arbeidsflyt.', 
 ARRAY['general', 'documentation'], 4);

-- Insert mappings between document categories and subject areas
INSERT INTO document_category_subject_area_mappings (document_category_id, subject_area, isa_standards, audit_phases, risk_level) 
SELECT 
  dc.id,
  CASE 
    WHEN dc.subject_area = 'hovedbok' THEN 'finance'
    WHEN dc.subject_area = 'lønn' THEN 'payroll' 
    WHEN dc.subject_area = 'salg' THEN 'sales'
    WHEN dc.subject_area = 'bank' THEN 'banking'
    WHEN dc.subject_area = 'lager' THEN 'inventory'
    WHEN dc.subject_area = 'anleggsmidler' THEN 'fixed_assets'
    WHEN dc.subject_area = 'leverandørgjeld' THEN 'payables'
    WHEN dc.subject_area = 'kundefordringer' THEN 'receivables'
    ELSE 'other'
  END as subject_area,
  CASE 
    WHEN dc.subject_area = 'hovedbok' THEN ARRAY['ISA 315', 'ISA 330', 'ISA 500']
    WHEN dc.subject_area = 'lønn' THEN ARRAY['ISA 315', 'ISA 330', 'ISA 240']
    WHEN dc.subject_area = 'salg' THEN ARRAY['ISA 240', 'ISA 315', 'ISA 330', 'ISA 505']
    WHEN dc.subject_area = 'bank' THEN ARRAY['ISA 330', 'ISA 505', 'ISA 501']
    ELSE ARRAY['ISA 315', 'ISA 330']
  END as isa_standards,
  ARRAY['planning', 'execution'] as audit_phases,
  CASE 
    WHEN dc.subject_area IN ('lønn', 'salg') THEN 'high'
    WHEN dc.subject_area IN ('hovedbok', 'bank') THEN 'medium'
    ELSE 'low'
  END as risk_level
FROM document_categories dc
WHERE dc.is_standard = true;

-- Add RLS policies
ALTER TABLE ai_revy_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_category_subject_area_mappings ENABLE ROW LEVEL SECURITY;

-- Everyone can read AI variants (they're system-wide)
CREATE POLICY "Everyone can read AI variants" ON ai_revy_variants FOR SELECT USING (true);

-- Everyone can read subject area mappings 
CREATE POLICY "Everyone can read subject area mappings" ON document_category_subject_area_mappings FOR SELECT USING (true);
