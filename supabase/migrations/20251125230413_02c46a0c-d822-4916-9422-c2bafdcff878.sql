-- Create subject area for Oppdragsvurdering (Engagement Assessment)
INSERT INTO subject_areas (name, display_name, description, icon, color, sort_order, is_active)
VALUES (
  'engagement_assessment',
  'Oppdragsvurdering',
  'Vurdering av uavhengighet, kompetanse, integritet og forhåndsbetingelser før oppdrag aksepteres eller fortsettes',
  '🤝',
  'blue',
  1,
  true
);

-- Get the subject area ID for reference
DO $$
DECLARE
  v_subject_area_id UUID;
BEGIN
  SELECT id INTO v_subject_area_id FROM subject_areas WHERE name = 'engagement_assessment';

  -- 1. Bekreft uavhengighet og etiske krav (N+E)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Bekreft uavhengighet og etiske krav',
    'Kontroller at revisor og teamet oppfyller alle relevante etiske krav, spesielt uavhengighetskravene',
    v_subject_area_id,
    'inquiry',
    'Sikre at revisor og teamet oppfyller etiske krav og uavhengighetskrav før oppdraget aksepteres',
    E'1. Gjennomgå og bekreft uavhengighetserklæringer fra alle teammedlemmer\n2. Identifiser og vurder potensielle interessekonflikter\n3. Kontroller at ingen trusler mot uavhengighet foreligger\n4. Dokumenter at etiske krav er oppfylt\n\nReferanse: ISA for MKE - Etiske krav og uavhengighet',
    'Signert uavhengighetserklæring fra teamet, dokumentert vurdering av etiske forhold',
    ARRAY['engagement']::audit_phase[],
    'high',
    1,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N+E (Alle klienter)"
      },
      {
        "id": "response",
        "label": "Er alle etiske krav og uavhengighetskrav oppfylt?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Beskriv hvordan kravet er oppfylt, eventuelle tiltak eller forbehold..."
      }
    ]'::jsonb
  );

  -- 2. Sikre nødvendig kompetanse og kapasitet (N+E)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Sikre nødvendig kompetanse og kapasitet',
    'Vurder om revisjonsteamet har riktig faglig kompetanse, bransjekunnskap og tilstrekkelige ressurser',
    v_subject_area_id,
    'inquiry',
    'Sikre at teamet har nødvendig kompetanse og kapasitet til å gjennomføre oppdraget forsvarlig',
    E'1. Vurder teamets samlede fagkompetanse innen revisjon og regnskap\n2. Evaluer bransjespesifikk kunnskap og erfaring\n3. Vurder behov for IT-revisjonskompetanse\n4. Sjekk tilgjengelige ressurser (tid og personale)\n5. Identifiser eventuelle kompetansegap og planlegg tiltak\n\nReferanse: ISA for MKE - Ressurser og kompetanse',
    'Dokumentert vurdering av teamets kompetanse og kapasitet, inkludert eventuelle tiltak',
    ARRAY['engagement']::audit_phase[],
    'high',
    2,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N+E (Alle klienter)"
      },
      {
        "id": "response",
        "label": "Har teamet nødvendig kompetanse og kapasitet?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Beskriv teamsammensetning, kompetanse, eventuelle gap og tiltak..."
      }
    ]'::jsonb
  );

  -- 3. Vurder kundens integritet og omdømmerisiko (N+E)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Vurder kundens integritet og omdømmerisiko',
    'Evaluer ledelsens integritet og eventuelle omdømmerisiko ved klienten',
    v_subject_area_id,
    'inquiry',
    'Identifisere potensielle integritets- og omdømmerisiko som kan påvirke oppdragsaksept',
    E'1. Innhent informasjon om ledelsens bakgrunn og omdømme\n2. Gjennomfør søk i offentlige registre (Brønnøysund, domstolsavgjørelser)\n3. Vurder eventuelle tidligere regelbrudd eller kontroversielle forhold\n4. Evaluer klientens forretningsmiljø og bransjerisiko\n5. Vurder om omdømmerisiko er akseptabel for revisjonsselskapet\n\nReferanse: ISA for MKE - Aksept av klientforhold',
    'Dokumentert vurdering av klientens integritet og omdømmerisiko',
    ARRAY['engagement']::audit_phase[],
    'high',
    3,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N+E (Alle klienter)"
      },
      {
        "id": "response",
        "label": "Er klientens integritet og omdømmerisiko akseptabel?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Beskriv funn fra bakgrunnssjekk, vurdering av risiko, eventuelle bekymringer..."
      }
    ]'::jsonb
  );

  -- 4. Bekreft akseptabelt rapporteringsrammeverk (N+E)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Bekreft akseptabelt rapporteringsrammeverk',
    'Sjekk at enhetens finansielle rapporteringsrammeverk er egnet og akseptabelt',
    v_subject_area_id,
    'inquiry',
    'Sikre at rapporteringsramme og forhåndsbetingelser er akseptable for revisjonsoppdraget',
    E'1. Identifiser hvilket regnskapsrammeverk klienten anvender (NGAAP/IFRS)\n2. Bekreft at ramme er egnet for enhetens størrelse og kompleksitet\n3. Verifiser at ledelsen aksepterer sitt ansvar for regnskapet\n4. Bekreft at ledelsen vil opprettholde internkontroll\n5. Sikre tilgang til all nødvendig informasjon og dokumentasjon\n\nReferanse: ISA for MKE - Forhåndsbetingelser for revisjon',
    'Dokumentert bekreftelse av rapporteringsrammeverk og ledelsens ansvarserkjennelse',
    ARRAY['engagement']::audit_phase[],
    'high',
    4,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N+E (Alle klienter)"
      },
      {
        "id": "response",
        "label": "Er rapporteringsramme akseptabelt og forhåndsbetingelser oppfylt?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Beskriv hvilket rammeverk som er valgt og bekreftelse av forhåndsbetingelser..."
      }
    ]'::jsonb
  );

  -- 5. Velg og dokumenter rapporteringsrammeverk (N+E) - Special framework selector
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Velg og dokumenter rapporteringsrammeverk',
    'Velg og dokumenter hvilket finansielt rapporteringsrammeverk som skal anvendes',
    v_subject_area_id,
    'inspection',
    'Formelt velge og dokumentere rapporteringsramme for klientens årsregnskap',
    E'1. Diskuter med ledelsen hvilket rammeverk som er mest egnet\n2. Vurder enhetens størrelse, kompleksitet og brukergrupper\n3. Dokumenter valgt rammeverk i engasjementsbrevet\n4. Sikre at valgt rammeverk er i samsvar med lovkrav\n\nReferanse: ISA for MKE - Anvendt regnskapsramme',
    'Dokumentert valg av rapporteringsrammeverk i engasjementsbrev',
    ARRAY['engagement']::audit_phase[],
    'medium',
    5,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N+E (Alle klienter)"
      },
      {
        "id": "framework",
        "label": "Valgt rapporteringsrammeverk",
        "type": "select",
        "required": true,
        "options": ["NGAAP små foretak", "NGAAP mellomstore foretak", "NGAAP store foretak", "IFRS", "Annet"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Begrunnelse",
        "type": "textarea",
        "required": false,
        "placeholder": "Begrunn valg av rammeverk, eventuelt spesifiser hvis Annet er valgt..."
      }
    ]'::jsonb
  );

  -- 6. Kontakt tidligere revisor (N - kun nye klienter)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Kontakt tidligere revisor og gjennomgå fjorårets regnskap',
    'For nye klienter: Kontakt avtroppende revisor og gjennomgå historiske regnskaper',
    v_subject_area_id,
    'inquiry',
    'Innhente informasjon fra tidligere revisor og identifisere potensielle åpningsbalanse-problemer',
    E'1. Send formell henvendelse til avtroppende revisor etter tillatelse fra klient\n2. Innhent informasjon om eventuelle uenigheter eller problematiske forhold\n3. Be om kopi av siste revisjonsberetning og årsregnskap\n4. Gjennomgå tidligere års regnskap for å identifisere vesentlige forhold\n5. Vurder åpningsbalanser og eventuelle effekter på inneværende revisjon\n\nReferanse: ISA for MKE - Kommunikasjon med tidligere revisor',
    'Dokumentert kommunikasjon med tidligere revisor, gjennomgang av historiske regnskaper',
    ARRAY['engagement']::audit_phase[],
    'high',
    6,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N (Kun nye klienter)"
      },
      {
        "id": "response",
        "label": "Er tidligere revisor kontaktet og historiske regnskaper gjennomgått?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI", "NA (Ikke aktuelt)"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Oppsummer funn fra kommunikasjon og gjennomgang, eventuelle forhold av betydning..."
      }
    ]'::jsonb
  );

  -- 7. Gjennomfør lovpålagte kundetiltak AML/KYC (N - kun nye klienter)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Gjennomfør lovpålagte kundetiltak (AML/KYC)',
    'For nye klienter: Fullfør alle nødvendige kundetiltak i henhold til hvitvaskingsloven',
    v_subject_area_id,
    'inspection',
    'Oppfylle krav til kundetiltak og kundekontroll i hvitvaskingsloven',
    E'1. Identifiser og verifiser klientens identitet (org.nr, stiftelsesdokumenter)\n2. Identifiser reelle rettighetshavere (eiere over 25%)\n3. Utfør PEP-søk (politisk eksponerte personer)\n4. Utfør sanksjonslistesøk og negative mediesøk\n5. Vurder hvitvaskingsrisiko og klassifiser klient\n6. Dokumenter alle funn og vurderinger i KYC-systemet\n\nReferanse: Hvitvaskingsloven § 4 og § 5',
    'Fullstendig KYC/AML-dokumentasjon i compliance-system',
    ARRAY['engagement']::audit_phase[],
    'high',
    7,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N (Kun nye klienter)"
      },
      {
        "id": "response",
        "label": "Er alle lovpålagte kundetiltak (AML/KYC) gjennomført?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI", "NA (Ikke aktuelt)"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Beskriv gjennomførte kundetiltak, identifiserte rettighetshavere, risikoklassifisering..."
      }
    ]'::jsonb
  );

  -- 8. Utarbeid og signér engasjementsbrev (N+E)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Utarbeid og signér engasjementsbrev',
    'Sett opp formelt engasjementsbrev og sørg for at det er signert av ledelsen',
    v_subject_area_id,
    'inspection',
    'Etablere en skriftlig avtale som bekrefter gjensidig forståelse av oppdragets vilkår',
    E'1. Utarbeid engasjementsbrev basert på standard mal\n2. Inkluder oppdragets omfang, ansvar, rapportering og honorar\n3. Beskriv anvendt regnskapsrammeverk og revisjonsstandarder\n4. Spesifiser ledelsens ansvar for regnskapet og internkontroll\n5. Send til ledelsen for gjennomgang og signering\n6. Arkiver signert engasjementsbrev i revisjonsarkivet\n\nReferanse: ISA for MKE - Engasjementsbrev',
    'Signert engasjementsbrev fra både revisor og klient',
    ARRAY['engagement']::audit_phase[],
    'high',
    8,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N+E (Alle klienter)"
      },
      {
        "id": "response",
        "label": "Er engasjementsbrev utarbeidet og signert?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Referanse til arkivert engasjementsbrev, eventuelle spesielle vilkår..."
      }
    ]'::jsonb
  );

  -- 9. Dokumenter formell aksept eller fortsettelse (N+E)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Dokumenter formell aksept eller fortsettelse',
    'Dokumenter at oppdraget formelt er akseptert/fortsatt med sign-off fra ansvarlig revisor',
    v_subject_area_id,
    'inspection',
    'Sikre formell godkjenning og dokumentasjon av oppdragsaksept eller kontinuitet',
    E'1. Gjennomgå at alle tidligere punkter i oppdragsvurderingen er fullført\n2. Bekreft at alle kriterier for aksept/kontinuitet er oppfylt\n3. Sign-off fra oppdragsansvarlig revisor\n4. Eventuell kvalitetskontrollør signerer der dette er påkrevd\n5. Dokumenter beslutning i revisjonsarkivet\n6. Oppdater status i revisjonssystemet\n\nReferanse: ISA for MKE - Dokumentasjon av oppdragsaksept, ISQM',
    'Formell sign-off dokumentert i systemet med tidsstempel',
    ARRAY['engagement']::audit_phase[],
    'high',
    9,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N+E (Alle klienter)"
      },
      {
        "id": "response",
        "label": "Er oppdraget formelt akseptert/fortsatt?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI"]
      },
      {
        "id": "signed_by",
        "label": "Godkjent av (oppdragsansvarlig revisor)",
        "type": "text",
        "required": true,
        "placeholder": "Navn på ansvarlig revisor"
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Eventuelle forbehold, særskilte forhold eller kommentarer til beslutningen..."
      }
    ]'::jsonb
  );

  -- 10. Vurder behovet for eksperter eller spesialister (N+E)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Vurder behovet for eksperter eller spesialister',
    'Identifiser behov for å benytte eksperter eller spesialister i revisjonen',
    v_subject_area_id,
    'inquiry',
    'Sikre at nødvendig spesialkompetanse er tilgjengelig for oppdraget',
    E'1. Vurder klientens kompleksitet (IT-systemer, verdsettelse, skatteforhold)\n2. Identifiser områder som krever spesialkompetanse\n3. Vurder behov for IT-revisor, verdsettelsesekspert, skatterådgiver, juridisk rådgiver, etc.\n4. Avklar tilgjengelighet og kostnad for nødvendige ressurser\n5. Dokumenter vurdering og eventuell plan for bruk av eksperter\n\nReferanse: ISA for MKE - Bruk av eksperters arbeid',
    'Dokumentert vurdering av behov for spesialister og plan for involvering',
    ARRAY['engagement']::audit_phase[],
    'medium',
    10,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "N+E (Alle klienter)"
      },
      {
        "id": "response",
        "label": "Er behov for eksperter/spesialister vurdert?",
        "type": "select",
        "required": true,
        "options": ["JA - behov identifisert", "JA - ikke behov", "NEI"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Beskriv eventuelle identifiserte behov, hvilke eksperter som skal benyttes, eller begrunn hvorfor det ikke er behov..."
      }
    ]'::jsonb
  );

  -- 11. Gjennomgå kontinuitetskrav for eksisterende klienter (E - kun eksisterende)
  INSERT INTO audit_action_templates (
    name, description, subject_area_id, action_type, objective, procedures,
    documentation_requirements, applicable_phases, risk_level, sort_order,
    is_system_template, is_active, response_fields
  ) VALUES (
    'Gjennomgå kontinuitetskrav for eksisterende klienter',
    'For eksisterende klienter: Vurder om oppdragsforholdet skal fortsette',
    v_subject_area_id,
    'inquiry',
    'Sikre at det ikke har oppstått forhold som tilsier at oppdraget bør avsluttes',
    E'1. Gjennomgå fjorårets revisjonsberetning og eventuelle forbehold\n2. Vurder om det har oppstått vesentlige endringer i klientens virksomhet\n3. Sjekk at honorarer fra tidligere år er betalt\n4. Vurder om det har oppstått nye trusler mot uavhengighet\n5. Bekreft at ledelsens integritet fortsatt er tilfredsstillende\n6. Vurder om teamet fortsatt har nødvendig kompetanse\n\nReferanse: ISA for MKE - Kontinuitet av klientforhold',
    'Dokumentert vurdering av kontinuitet for eksisterende klientforhold',
    ARRAY['engagement']::audit_phase[],
    'medium',
    11,
    true,
    true,
    '[
      {
        "id": "applies_to",
        "label": "Gjelder",
        "type": "text",
        "required": false,
        "placeholder": "E (Kun eksisterende klienter)"
      },
      {
        "id": "response",
        "label": "Skal oppdragsforholdet fortsette?",
        "type": "select",
        "required": true,
        "options": ["JA", "NEI", "NA (Ikke aktuelt)"]
      },
      {
        "id": "comment",
        "label": "Kommentar / Dokumentasjon",
        "type": "textarea",
        "required": false,
        "placeholder": "Oppsummer vurdering av kontinuitet, eventuelle endringer eller forhold av betydning..."
      }
    ]'::jsonb
  );

END $$;