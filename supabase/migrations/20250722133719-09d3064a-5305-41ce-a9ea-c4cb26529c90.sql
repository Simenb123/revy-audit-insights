
-- Rense duplikater i subject_areas og standardisere på norske navn
-- Først, identifiser og behold de norske versjonene

-- Opprett en temporary tabell for å mappe gamle til nye verdier
CREATE TEMPORARY TABLE subject_area_mapping AS
SELECT 
  old_id,
  new_id,
  old_name,
  new_name
FROM (
  VALUES 
    -- Mappe engelske til norske navn
    ((SELECT id FROM subject_areas WHERE name = 'auditing' LIMIT 1), 
     (SELECT id FROM subject_areas WHERE name = 'revisjon' LIMIT 1),
     'auditing', 'revisjon'),
    ((SELECT id FROM subject_areas WHERE name = 'accounting' LIMIT 1), 
     (SELECT id FROM subject_areas WHERE name = 'regnskap' LIMIT 1),
     'accounting', 'regnskap'),
    ((SELECT id FROM subject_areas WHERE name = 'taxation' LIMIT 1), 
     (SELECT id FROM subject_areas WHERE name = 'skatt' LIMIT 1),
     'taxation', 'skatt'),
    ((SELECT id FROM subject_areas WHERE name = 'legal' LIMIT 1), 
     (SELECT id FROM subject_areas WHERE name = 'juridisk' LIMIT 1),
     'legal', 'juridisk'),
    ((SELECT id FROM subject_areas WHERE name = 'finance' LIMIT 1), 
     (SELECT id FROM subject_areas WHERE name = 'finans' LIMIT 1),
     'finance', 'finans')
) AS mapping(old_id, new_id, old_name, new_name)
WHERE old_id IS NOT NULL AND new_id IS NOT NULL AND old_id != new_id;

-- Oppdater alle referanser til de gamle IDene
UPDATE article_subject_areas 
SET subject_area_id = (
  SELECT new_id FROM subject_area_mapping WHERE old_id = subject_area_id
)
WHERE subject_area_id IN (SELECT old_id FROM subject_area_mapping);

UPDATE audit_action_subject_areas 
SET subject_area_id = (
  SELECT new_id FROM subject_area_mapping WHERE old_id = subject_area_id
)
WHERE subject_area_id IN (SELECT old_id FROM subject_area_mapping);

UPDATE document_type_subject_areas 
SET subject_area_id = (
  SELECT new_id FROM subject_area_mapping WHERE old_id = subject_area_id
)
WHERE subject_area_id IN (SELECT old_id FROM subject_area_mapping);

-- Slett de gamle engelske versjonene
DELETE FROM subject_areas 
WHERE id IN (SELECT old_id FROM subject_area_mapping);

-- Oppdater og standardiser eksisterende norske emneområder
UPDATE subject_areas 
SET 
  display_name = CASE name
    WHEN 'revisjon' THEN 'Revisjon'
    WHEN 'regnskap' THEN 'Regnskap' 
    WHEN 'skatt' THEN 'Skatt'
    WHEN 'juridisk' THEN 'Juridisk'
    WHEN 'finans' THEN 'Finans'
    WHEN 'internkontroll' THEN 'Internkontroll'
    WHEN 'bokforing' THEN 'Bokføring'
    WHEN 'hvitvasking' THEN 'Hvitvasking'
    ELSE display_name
  END,
  description = CASE name
    WHEN 'revisjon' THEN 'Revisjonsmetodikk, standarder og prosedyrer'
    WHEN 'regnskap' THEN 'Regnskapsstandarder og regnskapsregler'
    WHEN 'skatt' THEN 'Skattelover og skatteregler'
    WHEN 'juridisk' THEN 'Lover, forskrifter og rettsavgjørelser'
    WHEN 'finans' THEN 'Finansielle analyser og rapportering'
    WHEN 'internkontroll' THEN 'Internkontroll og risikostyring'
    WHEN 'bokforing' THEN 'Bokføringsloven og bokføringspraksis'
    WHEN 'hvitvasking' THEN 'Hvitvaskingsloven og AML-prosedyrer'
    ELSE description
  END,
  sort_order = CASE name
    WHEN 'revisjon' THEN 10
    WHEN 'regnskap' THEN 20
    WHEN 'skatt' THEN 30
    WHEN 'juridisk' THEN 40
    WHEN 'finans' THEN 50
    WHEN 'internkontroll' THEN 60
    WHEN 'bokforing' THEN 70
    WHEN 'hvitvasking' THEN 80
    ELSE sort_order
  END
WHERE name IN ('revisjon', 'regnskap', 'skatt', 'juridisk', 'finans', 'internkontroll', 'bokforing', 'hvitvasking');

-- Fjern emneområder som ikke brukes aktivt
DELETE FROM subject_areas 
WHERE name NOT IN (
  'revisjon', 'regnskap', 'skatt', 'juridisk', 'finans', 
  'internkontroll', 'bokforing', 'hvitvasking',
  'inntekter', 'varelager', 'anleggsmidler', 'gjeld', 'egenkapital', 'lonn'
) 
AND id NOT IN (
  SELECT DISTINCT subject_area_id FROM article_subject_areas WHERE subject_area_id IS NOT NULL
  UNION
  SELECT DISTINCT subject_area_id FROM audit_action_subject_areas WHERE subject_area_id IS NOT NULL
  UNION  
  SELECT DISTINCT subject_area_id FROM document_type_subject_areas WHERE subject_area_id IS NOT NULL
);

-- Rens også content_types for duplikater
UPDATE content_types 
SET 
  display_name = CASE name
    WHEN 'fagartikkel' THEN 'Fagartikkel'
    WHEN 'isa_standard' THEN 'ISA Standard'
    WHEN 'lov' THEN 'Lov'
    WHEN 'forskrift' THEN 'Forskrift'
    WHEN 'rundskriv' THEN 'Rundskriv'
    WHEN 'veiledning' THEN 'Veiledning'
    WHEN 'sjekkliste' THEN 'Sjekkliste'
    WHEN 'prosedyre' THEN 'Prosedyre'
    WHEN 'metodikk' THEN 'Metodikk'
    ELSE display_name
  END,
  sort_order = CASE name
    WHEN 'fagartikkel' THEN 10
    WHEN 'isa_standard' THEN 20
    WHEN 'lov' THEN 30
    WHEN 'forskrift' THEN 40
    WHEN 'rundskriv' THEN 50
    WHEN 'veiledning' THEN 60
    WHEN 'sjekkliste' THEN 70
    WHEN 'prosedyre' THEN 80
    WHEN 'metodikk' THEN 90
    ELSE sort_order
  END
WHERE name IN ('fagartikkel', 'isa_standard', 'lov', 'forskrift', 'rundskriv', 'veiledning', 'sjekkliste', 'prosedyre', 'metodikk');
