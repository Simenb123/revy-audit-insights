
-- Fix the audit_action_templates table structure first
-- We need to handle the old ENUM column properly

-- First, make the old subject_area column nullable temporarily
ALTER TABLE public.audit_action_templates ALTER COLUMN subject_area DROP NOT NULL;

-- Update any existing records that don't have subject_area_id set
UPDATE public.audit_action_templates 
SET subject_area_id = (
  SELECT id FROM public.subject_areas WHERE name = 'finans' LIMIT 1
)
WHERE subject_area_id IS NULL;

-- Now set a default value for subject_area column based on subject_area_id
UPDATE public.audit_action_templates 
SET subject_area = 'other'
WHERE subject_area IS NULL;

-- Clean up duplicate subject areas (keep the ones with more data)
DELETE FROM public.subject_areas 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
    FROM public.subject_areas
  ) t WHERE rn > 1
);

-- Ensure we have proper hierarchical subject areas with display names
INSERT INTO public.subject_areas (name, display_name, description, icon, color, sort_order, is_active) VALUES
('inntekter_salg', 'Inntekter/Salg', 'Inntektsføring og salgsrelaterte emner', '💰', '#10B981', 10, true),
('lonn', 'Lønn', 'Lønn og personalrelaterte kostnader', '👥', '#3B82F6', 20, true),
('andre_driftskostnader', 'Andre driftskostnader', 'Øvrige driftskostnader og utgifter', '📋', '#F59E0B', 30, true),
('varelager', 'Varelager', 'Lager og varebeholdning', '📦', '#8B5CF6', 40, true),
('finans', 'Finans', 'Finansielle poster og investeringer', '🏦', '#EF4444', 50, true),
('banktransaksjoner', 'Banktransaksjoner', 'Bankkonto og transaksjoner', '🏦', '#06B6D4', 60, true),
('investeringer_anleggsmidler', 'Investeringer/Anleggsmidler', 'Anleggsmidler og investeringer', '🏗️', '#84CC16', 70, true),
('kundefordringer', 'Kundefordringer', 'Kundefordringer og fordringer', '📄', '#F97316', 80, true),
('leverandorgjeld', 'Leverandørgjeld', 'Leverandørgjeld og kortsiktig gjeld', '💳', '#EF4444', 90, true),
('egenkapital', 'Egenkapital', 'Egenkapital og eierforhold', '💎', '#8B5CF6', 100, true),
('naerstaaende_transaksjoner', 'Nærstående transaksjoner', 'Transaksjoner med nærstående parter', '🤝', '#F59E0B', 110, true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Ensure we have some basic knowledge categories
INSERT INTO public.knowledge_categories (name, description, display_order) VALUES
('ISA-standarder', 'Internasjonale revisjonstandarder', 10),
('NRS-standarder', 'Norske revisjonstandarder', 20),
('Lovgivning', 'Relevante lover og forskrifter', 30),
('Veiledninger', 'Faglige veiledninger og prosedyrer', 40),
('Sjekklister', 'Sjekklister for revisjonsarbeid', 50)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Add basic content types if they don't exist
INSERT INTO public.content_types (name, display_name, description) VALUES
('fagartikkel', 'Fagartikkel', 'Standard fagartikkel'),
('veiledning', 'Veiledning', 'Praktisk veiledning'),
('sjekkliste', 'Sjekkliste', 'Sjekkliste for arbeid')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;
