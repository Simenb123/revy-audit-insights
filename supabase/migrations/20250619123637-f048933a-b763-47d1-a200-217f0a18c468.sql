
-- Create document types table for specific document types
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  file_pattern_hints TEXT[], -- e.g., ['hovedbok', 'general_ledger', 'GL']
  expected_structure JSONB, -- Expected columns/format for this type
  validation_rules JSONB, -- Rules for validating this document type
  is_standard BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create many-to-many relationship between documents and categories
CREATE TABLE IF NOT EXISTS public.document_type_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type_id UUID NOT NULL REFERENCES public.document_types(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.document_categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Mark primary category
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_type_id, category_id)
);

-- Create enhanced metadata table for documents
CREATE TABLE IF NOT EXISTS public.document_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.client_documents_files(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES public.document_types(id),
  detected_system TEXT, -- Accounting system detected (visma_business, tripletex, etc)
  period_year INTEGER,
  period_month INTEGER,
  period_start DATE,
  period_end DATE,
  employee_id UUID, -- For salary documents
  contract_date DATE, -- For contracts
  amount_fields JSONB, -- Extracted amounts and their meanings
  column_mappings JSONB, -- How columns were mapped
  validation_status TEXT DEFAULT 'pending', -- pending, validated, failed
  validation_errors JSONB,
  quality_score NUMERIC(3,2), -- 0.0 to 1.0
  processing_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tags table for flexible labeling
CREATE TABLE IF NOT EXISTS public.document_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  description TEXT,
  is_system_tag BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create many-to-many relationship between documents and tags
CREATE TABLE IF NOT EXISTS public.document_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.client_documents_files(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.document_tags(id) ON DELETE CASCADE,
  assigned_by_ai BOOLEAN DEFAULT false,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, tag_id)
);

-- Create document relationships table for linking related documents
CREATE TABLE IF NOT EXISTS public.document_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_document_id UUID NOT NULL REFERENCES public.client_documents_files(id) ON DELETE CASCADE,
  child_document_id UUID NOT NULL REFERENCES public.client_documents_files(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'supersedes', 'supplements', 'related_to', 'part_of'
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_document_id, child_document_id, relationship_type)
);

-- Insert standard document types (using ON CONFLICT to avoid duplicates)
INSERT INTO public.document_types (name, display_name, description, file_pattern_hints, expected_structure) VALUES
('hovedbok', 'Hovedbok / General Ledger', 'Komplett oversikt over alle transaksjoner', 
 ARRAY['hovedbok', 'general_ledger', 'gl', 'transactions'], 
 '{"required_columns": ["account", "date", "amount"], "optional_columns": ["description", "voucher_no"]}'),
 
('saldobalanse', 'Saldobalanse / Trial Balance', 'Saldoer per konto på et gitt tidspunkt',
 ARRAY['saldobalanse', 'trial_balance', 'saldo', 'balance'],
 '{"required_columns": ["account", "balance"], "optional_columns": ["account_name", "opening_balance"]}'),
 
('ansettelsesavtale', 'Ansettelsesavtale', 'Kontrakt mellom arbeidsgiver og arbeidstaker',
 ARRAY['ansettelse', 'employment', 'contract', 'avtale'],
 '{"required_fields": ["employee_name", "start_date", "salary"], "document_type": "contract"}'),
 
('lonnslipp', 'Lønnsslipp', 'Detaljert oversikt over lønn og trekk',
 ARRAY['lonnslipp', 'payslip', 'salary', 'lonn'],
 '{"required_fields": ["employee", "period", "gross_salary", "net_salary"]}'),
 
('faktura', 'Faktura', 'Salgsfaktura eller innkjøpsfaktura',
 ARRAY['faktura', 'invoice', 'regning'],
 '{"required_fields": ["invoice_number", "date", "amount", "customer_supplier"]}'),
 
('bankutskrift', 'Bankutskrift', 'Oversikt over banktransaksjoner',
 ARRAY['bank', 'statement', 'utskrift', 'transactions'],
 '{"required_columns": ["date", "description", "amount", "balance"]}')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  file_pattern_hints = EXCLUDED.file_pattern_hints,
  expected_structure = EXCLUDED.expected_structure,
  updated_at = now();

-- Link document types to existing categories (using ON CONFLICT to avoid duplicates)
INSERT INTO public.document_type_categories (document_type_id, category_id, is_primary)
SELECT dt.id, dc.id, true
FROM public.document_types dt, public.document_categories dc
WHERE (dt.name = 'hovedbok' AND dc.category_name = 'Hovedbok')
   OR (dt.name = 'saldobalanse' AND dc.category_name = 'Saldobalanse')
   OR (dt.name = 'lonnslipp' AND dc.category_name = 'Lønnslipper')
   OR (dt.name = 'ansettelsesavtale' AND dc.category_name = 'Lønnslipper')
ON CONFLICT (document_type_id, category_id) DO NOTHING;

-- Add secondary categories for cross-cutting documents
INSERT INTO public.document_type_categories (document_type_id, category_id, is_primary)
SELECT dt.id, dc.id, false
FROM public.document_types dt, public.document_categories dc
WHERE dt.name = 'ansettelsesavtale' AND dc.subject_area = 'lnn'
ON CONFLICT (document_type_id, category_id) DO NOTHING;

-- Insert standard tags (using ON CONFLICT to avoid duplicates)
INSERT INTO public.document_tags (name, display_name, color, description, is_system_tag) VALUES
('urgent', 'Urgent', '#EF4444', 'Requires immediate attention', true),
('reviewed', 'Reviewed', '#10B981', 'Has been reviewed by auditor', true),
('incomplete', 'Incomplete', '#F59E0B', 'Missing required information', true),
('automated', 'Automated Import', '#6366F1', 'Imported automatically', true),
('manual_review', 'Manual Review Required', '#EC4899', 'Needs manual verification', true),
('year_end', 'Year End', '#8B5CF6', 'Year-end closing documents', false),
('comparative', 'Comparative', '#06B6D4', 'For comparative analysis', false)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  color = EXCLUDED.color,
  description = EXCLUDED.description,
  is_system_tag = EXCLUDED.is_system_tag;

-- Add RLS policies for new tables (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_types' AND policyname = 'Anyone can view document types') THEN
    ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can view document types" ON public.document_types FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_type_categories' AND policyname = 'Anyone can view document type categories') THEN
    ALTER TABLE public.document_type_categories ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can view document type categories" ON public.document_type_categories FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_tags' AND policyname = 'Anyone can view document tags') THEN
    ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can view document tags" ON public.document_tags FOR SELECT USING (true);
  END IF;
  
  -- Enable RLS for other tables
  ALTER TABLE public.document_metadata ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.document_tag_assignments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;
END $$;

-- RLS policies for document metadata (user's clients only)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_metadata' AND policyname = 'Users can view metadata for their client documents') THEN
    CREATE POLICY "Users can view metadata for their client documents" ON public.document_metadata
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.client_documents_files cdf
          JOIN public.clients c ON cdf.client_id = c.id
          WHERE cdf.id = document_metadata.document_id 
          AND c.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_metadata' AND policyname = 'Users can insert metadata for their client documents') THEN
    CREATE POLICY "Users can insert metadata for their client documents" ON public.document_metadata
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.client_documents_files cdf
          JOIN public.clients c ON cdf.client_id = c.id
          WHERE cdf.id = document_metadata.document_id 
          AND c.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_metadata' AND policyname = 'Users can update metadata for their client documents') THEN
    CREATE POLICY "Users can update metadata for their client documents" ON public.document_metadata
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.client_documents_files cdf
          JOIN public.clients c ON cdf.client_id = c.id
          WHERE cdf.id = document_metadata.document_id 
          AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add updated_at triggers (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_document_types') THEN
    CREATE TRIGGER set_updated_at_document_types
      BEFORE UPDATE ON public.document_types
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_document_metadata') THEN
    CREATE TRIGGER set_updated_at_document_metadata
      BEFORE UPDATE ON public.document_metadata
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_document_metadata_document_id ON public.document_metadata(document_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_type_id ON public.document_metadata(document_type_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_period ON public.document_metadata(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_document_tag_assignments_document_id ON public.document_tag_assignments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tag_assignments_tag_id ON public.document_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_document_relationships_parent ON public.document_relationships(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_document_relationships_child ON public.document_relationships(child_document_id);
