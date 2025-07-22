
-- Rydde opp i subject_areas og opprette klar hierarkisk struktur

-- Først, slett duplikater og ubrukte emneområder
DELETE FROM subject_areas 
WHERE name IN ('sales', 'payroll', 'operating_expenses', 'inventory', 'finance', 'banking', 'fixed_assets', 'receivables', 'payables', 'equity', 'other')
OR name IN ('accounting', 'auditing', 'taxation', 'legal');

-- Oppdater eksisterende norske hovedemner
UPDATE subject_areas 
SET 
  display_name = 'Revisjon',
  description = 'Revisjonsmetodikk, standarder og prosedyrer',
  sort_order = 10,
  color = '#8B5CF6',
  icon = '🔍',
  parent_subject_area_id = NULL
WHERE name = 'revisjon';

UPDATE subject_areas 
SET 
  display_name = 'Regnskap',
  description = 'Regnskapsstandarder og regnskapsregler',
  sort_order = 20,
  color = '#10B981',
  icon = '📊',
  parent_subject_area_id = NULL
WHERE name = 'regnskap';

UPDATE subject_areas 
SET 
  display_name = 'Skatt',
  description = 'Skattelover og skatteregler',
  sort_order = 30,
  color = '#F59E0B',
  icon = '💰',
  parent_subject_area_id = NULL
WHERE name = 'skatt';

UPDATE subject_areas 
SET 
  display_name = 'Juridisk',
  description = 'Lover, forskrifter og rettsavgjørelser',
  sort_order = 40,
  color = '#EF4444',
  icon = '⚖️',
  parent_subject_area_id = NULL
WHERE name = 'juridisk';

UPDATE subject_areas 
SET 
  display_name = 'Finans',
  description = 'Finansiell analyse og rapportering',
  sort_order = 50,
  color = '#6366F1',
  icon = '🏦',
  parent_subject_area_id = NULL
WHERE name = 'finans';

-- Legg til manglende hovedemner
INSERT INTO subject_areas (name, display_name, description, sort_order, color, icon, is_active, parent_subject_area_id)
VALUES 
('internkontroll', 'Internkontroll', 'Internkontroll og risikostyring', 60, '#059669', '🛡️', true, NULL),
('bokforing', 'Bokføring', 'Bokføringsloven og bokføringspraksis', 70, '#7C3AED', '📝', true, NULL),
('hvitvasking', 'Hvitvasking', 'Hvitvaskingsloven og AML-prosedyrer', 80, '#DC2626', '🚨', true, NULL)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  parent_subject_area_id = EXCLUDED.parent_subject_area_id;

-- Opprette underemner for Revisjon
INSERT INTO subject_areas (name, display_name, description, sort_order, color, icon, is_active, parent_subject_area_id)
VALUES 
('planlegging', 'Planlegging', 'Revisjonsplanlegging og forberedelse', 110, '#8B5CF6', '📋', true, (SELECT id FROM subject_areas WHERE name = 'revisjon')),
('gjennomforing', 'Gjennomføring', 'Revisjonshandlinger og testing', 120, '#8B5CF6', '⚡', true, (SELECT id FROM subject_areas WHERE name = 'revisjon')),
('rapportering', 'Rapportering', 'Revisjonsrapport og konklusjoner', 130, '#8B5CF6', '📄', true, (SELECT id FROM subject_areas WHERE name = 'revisjon')),
('dokumentasjon', 'Dokumentasjon', 'Revisjonsdokumentasjon og arkivering', 140, '#8B5CF6', '🗂️', true, (SELECT id FROM subject_areas WHERE name = 'revisjon'))
ON CONFLICT (name) DO UPDATE SET
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'revisjon'),
  sort_order = EXCLUDED.sort_order;

-- Opprette underemner for Regnskap  
INSERT INTO subject_areas (name, display_name, description, sort_order, color, icon, is_active, parent_subject_area_id)
VALUES 
('ifrs', 'IFRS', 'Internasjonale regnskapsstandarder', 210, '#10B981', '🌍', true, (SELECT id FROM subject_areas WHERE name = 'regnskap')),
('norsk_gaap', 'Norsk GAAP', 'Norske regnskapsstandarder', 220, '#10B981', '🇳🇴', true, (SELECT id FROM subject_areas WHERE name = 'regnskap')),
('konsernregnskap', 'Konsernregnskap', 'Konsernregnskapsregler', 230, '#10B981', '🏢', true, (SELECT id FROM subject_areas WHERE name = 'regnskap'))
ON CONFLICT (name) DO UPDATE SET
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'regnskap'),
  sort_order = EXCLUDED.sort_order;

-- Opprette underemner for Skatt
INSERT INTO subject_areas (name, display_name, description, sort_order, color, icon, is_active, parent_subject_area_id)
VALUES 
('selskapsskatt', 'Selskapsskatt', 'Skatt for selskaper og organisasjoner', 310, '#F59E0B', '🏢', true, (SELECT id FROM subject_areas WHERE name = 'skatt')),
('personskatt', 'Personskatt', 'Skatt for privatpersoner', 320, '#F59E0B', '👤', true, (SELECT id FROM subject_areas WHERE name = 'skatt')),
('merverdiavgift', 'Merverdiavgift', 'MVA-regler og håndtering', 330, '#F59E0B', '🧾', true, (SELECT id FROM subject_areas WHERE name = 'skatt'))
ON CONFLICT (name) DO UPDATE SET
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'skatt'),
  sort_order = EXCLUDED.sort_order;

-- Flytt eksisterende spesifikke emner under riktige foreldre
UPDATE subject_areas 
SET 
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'regnskap'),
  sort_order = 250
WHERE name = 'inntekter';

UPDATE subject_areas 
SET 
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'regnskap'),
  sort_order = 260
WHERE name = 'varelager';

UPDATE subject_areas 
SET 
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'regnskap'),
  sort_order = 270
WHERE name = 'anleggsmidler';

UPDATE subject_areas 
SET 
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'regnskap'),
  sort_order = 280
WHERE name = 'gjeld';

UPDATE subject_areas 
SET 
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'finans'),
  sort_order = 510
WHERE name = 'egenkapital';

UPDATE subject_areas 
SET 
  parent_subject_area_id = (SELECT id FROM subject_areas WHERE name = 'regnskap'),
  sort_order = 290
WHERE name = 'lonn';

-- Slett emneområder som ikke har noen tilknyttede artikler eller handlinger
DELETE FROM subject_areas 
WHERE id NOT IN (
  SELECT DISTINCT subject_area_id FROM article_subject_areas WHERE subject_area_id IS NOT NULL
  UNION
  SELECT DISTINCT subject_area_id FROM audit_action_subject_areas WHERE subject_area_id IS NOT NULL
  UNION
  SELECT DISTINCT subject_area_id FROM document_type_subject_areas WHERE subject_area_id IS NOT NULL
) 
AND parent_subject_area_id IS NULL
AND name NOT IN ('revisjon', 'regnskap', 'skatt', 'juridisk', 'finans', 'internkontroll', 'bokforing', 'hvitvasking');
