/**
 * Standard packages for common audit phases
 * Each package contains pre-configured audit actions for a specific phase
 */

export interface StandardActionItem {
  name: string;
  description: string;
  subject_area: 'finance' | 'operations' | 'compliance' | 'it' | 'other';
  action_type: 'analytical' | 'substantive' | 'control_test' | 'inquiry' | 'observation' | 'inspection' | 'recalculation' | 'confirmation';
  risk_level: string;
  procedures: string;
}

export const ENGAGEMENT_PACKAGE: StandardActionItem[] = [
  {
    name: 'Vurdering av finansielt rammeverk (NGAAP)',
    description: 'Bekreft at valgt regnskapsprinsipp er akseptabelt for enheten. Terskelverdier kan beregnes fra saldobalanse.',
    subject_area: 'finance',
    action_type: 'analytical',
    risk_level: 'high',
    procedures: [
      '- [ ] Identifiser valgt rammeverk (NGAAP/IFRS) og begrunnelse',
      '- [ ] Hent nøkkeltall fra siste saldobalanse (omsetning, totalkapital)',
      '- [ ] Sammenlign mot terskelverdier i NGAAP',
      '- [ ] Vurder behov for avvikshåndtering',
      '',
      'Resultat: Dokumenter vurdering og konklusjon. '
    ].join('\n')
  },
  {
    name: 'Kompetanse, uavhengighet og ressurser i teamet',
    description: 'Vurder teamets uavhengighet, kompetanse og kapasitet for oppdraget.',
    subject_area: 'other',
    action_type: 'inquiry',
    risk_level: 'medium',
    procedures: [
      '- [ ] Uavhengighetserklæring fra alle teammedlemmer',
      '- [ ] Kartlegg relevant erfaring og kompetanse',
      '- [ ] Vurder ressursbehov vs. tilgjengelige ressurser',
      '',
      'Resultat: Oppsummer vurdering og eventuelle tiltak.'
    ].join('\n')
  },
  {
    name: 'Organisasjons- og eierstruktur (forberedelse)',
    description: 'Innhent og dokumenter organisasjonskart og eierstruktur. Forbereder senere automatikk mot aksjonærregisteret.',
    subject_area: 'other',
    action_type: 'inquiry',
    risk_level: 'medium',
    procedures: [
      '- [ ] Innhent organisasjonskart/eierstruktur',
      '- [ ] Identifiser nøkkelpersoner og roller',
      '- [ ] Vurder behov for videre innhenting',
      '',
      'Resultat: Last opp dokumentasjon og oppsummer.'
    ].join('\n')
  },
  {
    name: 'Engasjementsbrev – forhåndsbetingelser',
    description: 'Sørg for at engasjementsbrev er utarbeidet og godkjent. Kan senere genereres fra mal og sendes til signering.',
    subject_area: 'other',
    action_type: 'inspection',
    risk_level: 'high',
    procedures: [
      '- [ ] Gå gjennom mal for engasjementsbrev',
      '- [ ] Tilpass til klientens forhold',
      '- [ ] Innhent godkjenning fra ledelsen',
      '',
      'Resultat: Arkiver signert brev og dokumenter eventuelle forutsetninger.'
    ].join('\n')
  },
  {
    name: 'Oppstartsmøte/teammøte – agenda og referat',
    description: 'Planlegg og gjennomfør oppstartsmøte. Agenda fra mal; referat arkiveres under handlingen.',
    subject_area: 'other',
    action_type: 'observation',
    risk_level: 'medium',
    procedures: [
      '- [ ] Hent agendamal og tilpass',
      '- [ ] Gjennomfør møte og dokumenter beslutninger',
      '- [ ] Lagre referat og oppfølgingspunkter',
      '',
      'Resultat: Oppsummer hovedpunkter og ansvarlige.'
    ].join('\n')
  }
];

export const PLANNING_PACKAGE: StandardActionItem[] = [
  {
    name: 'Analytiske innledende handlinger',
    description: 'Utfør overordnet analyse av regnskapsdata for å identifisere risikoområder.',
    subject_area: 'finance',
    action_type: 'analytical',
    risk_level: 'medium',
    procedures: [
      '- [ ] Last inn saldobalanse og nøkkeltall',
      '- [ ] Utfør trend- og forholdsanalyser',
      '- [ ] Identifiser avvik og mulige risikoområder',
      '',
      'Resultat: Dokumenter funn og planlagt respons.'
    ].join('\n')
  },
  {
    name: 'Kontroll av inngående balanse (ISA 210)',
    description: 'Avstem IB mot UB foregående år og vurder eventuelle differanser.',
    subject_area: 'finance',
    action_type: 'recalculation',
    risk_level: 'high',
    procedures: [
      '- [ ] Hent UB foregående år',
      '- [ ] Sammenlign mot IB inneværende år',
      '- [ ] Undersøk og forklar differanser',
      '',
      'Resultat: Dokumenter konklusjon og behov for justeringer.'
    ].join('\n')
  },
  {
    name: 'Vurdering av fortsatt drift',
    description: 'Vurder forutsetningen om fortsatt drift basert på tilgjengelig informasjon.',
    subject_area: 'finance',
    action_type: 'analytical',
    risk_level: 'high',
    procedures: [
      '- [ ] Gå gjennom kontantstrøm og kapitalstruktur',
      '- [ ] Vurder hendelser etter balansedagen',
      '- [ ] Diskuter med ledelsen og vurder tiltak',
      '',
      'Resultat: Dokumenter vurdering, indikatorer og konklusjon.'
    ].join('\n')
  }
];

/**
 * Get standard package for a given phase
 */
export function getStandardPackage(phase: 'engagement' | 'planning'): StandardActionItem[] {
  switch (phase) {
    case 'engagement':
      return ENGAGEMENT_PACKAGE;
    case 'planning':
      return PLANNING_PACKAGE;
    default:
      return [];
  }
}
