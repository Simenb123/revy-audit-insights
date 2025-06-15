
import { AuditPhase } from '@/types/revio';
import { ProcessGuidance } from '@/types/auditProcess';

export const phaseGuidanceData: Record<AuditPhase, ProcessGuidance> = {
  'overview': {
    phaseDescription: 'Oversikt og innledende planlegging av revisjonsoppdraget',
    keyObjectives: [
      'Forstå klientens virksomhet og bransje',
      'Identifiser preliminære risikoområder',
      'Planlegg revisjonsressurser og tidsplan'
    ],
    commonPitfalls: [
      'Utilstrekkelig forståelse av klientens forretningsmodell',
      'Manglende identifisering av bransjespecifikke risikoer',
      'Undervurdering av kompleksitet og tidsbruk'
    ],
    isaReferences: ['ISA 300', 'ISA 315'],
    bestPractices: [
      'Gjennomfør grundige klientintervjuer',
      'Analyser bransjetrender og regulatoriske endringer',
      'Utarbeid detaljert prosjektplan med milepæler'
    ]
  },
  'engagement': {
    phaseDescription: 'Etablering og oppfølging av revisjonsoppdraget',
    keyObjectives: [
      'Inngå oppdragsbrev',
      'Etablere kommunikasjonslinjer',
      'Klargjøre forventninger'
    ],
    commonPitfalls: [
      'Uklare oppdragsbetingelser',
      'Manglende kommunikasjon med ledelsen'
    ],
    isaReferences: ['ISA 210', 'ISA 260'],
    bestPractices: [
      'Tydelig oppdragsbrev',
      'Regelmessig kommunikasjon med ledelsen'
    ]
  },
  'planning': {
    phaseDescription: 'Detaljert planlegging av revisjonstilnærmingen',
    keyObjectives: [
      'Fastsette materialitetsnivå',
      'Identifisere og vurdere risikoer',
      'Utvikle revisjonsstrategien',
      'Planlegge testing og prosedyrer'
    ],
    commonPitfalls: [
      'Feil materialitetsnivå',
      'Manglende risikovurdering',
      'Utilstrekkelig planlegging av IT-kontroller'
    ],
    isaReferences: ['ISA 300', 'ISA 315', 'ISA 320', 'ISA 330'],
    bestPractices: [
      'Bruk bransjedata for materialitetsberegninger',
      'Dokumenter alle risikovurderinger grundig',
      'Involver IT-revisjon tidlig i prosessen'
    ]
  },
  'risk_assessment': {
    phaseDescription: 'Grundig vurdering av risikoer for vesentlig feilinformasjon',
    keyObjectives: [
      'Identifisere risikoer på påstandsnivå',
      'Vurdere kontrollmiljøet',
      'Bestemme testing av kontroller',
      'Planlegge substansielle handlinger'
    ],
    commonPitfalls: [
      'Overfladisk risikovurdering',
      'Manglende kobling mellom risiko og respons',
      'Utilstrekkelig forståelse av IT-systemer'
    ],
    isaReferences: ['ISA 315', 'ISA 330', 'ISA 540'],
    bestPractices: [
      'Bruk risikomatriser for strukturert analyse',
      'Involver erfarne teammedlemmer i risikovurdering',
      'Dokumenter alle vurderinger med begrunnelser'
    ]
  },
  'execution': {
    phaseDescription: 'Gjennomføring av planlagte revisjonshandlinger',
    keyObjectives: [
      'Utføre testing av kontroller',
      'Gjennomføre substansielle handlinger',
      'Innhente tilstrekkelig revisjonsbevis',
      'Evaluere funn og konklusjoner'
    ],
    commonPitfalls: [
      'Utilstrekkelig testing',
      'Dårlig dokumentasjon av funn',
      'Manglende oppfølging av avvik'
    ],
    isaReferences: ['ISA 330', 'ISA 500', 'ISA 505', 'ISA 520'],
    bestPractices: [
      'Test kontroller først hvis planlagt',
      'Bruk analytiske handlinger effektivt',
      'Dokumenter alle funn umiddelbart'
    ]
  },
  'completion': {
    phaseDescription: 'Avslutning av revisjonen og rapportering',
    keyObjectives: [
      'Evaluere revisjonsbevis',
      'Konkludere på alle påstander',
      'Utarbeide revisjonsberetning',
      'Gjennomføre kvalitetskontroll'
    ],
    commonPitfalls: [
      'Manglende evaluering av bevis',
      'Utilstrekkelig kvalitetskontroll',
      'Sen rapportering'
    ],
    isaReferences: ['ISA 700', 'ISA 705', 'ISA 720'],
    bestPractices: [
      'Gjennomfør systematic review av alle arbeidsområder',
      'Kvalitetskontroll av erfaren revisor',
      'Tidlig utarbeidelse av utkast til beretning'
    ]
  },
  'reporting': {
    phaseDescription: 'Utforming og levering av revisjonsrapporter',
    keyObjectives: [
      'Utarbeide endelig revisjonsberetning',
      'Kommunisere funn til ledelse og styre',
      'Arkivere revisjonsdokumentasjon'
    ],
    commonPitfalls: [
      'Uklare formuleringer i beretningen',
      'Forsinket kommunikasjon av vesentlige funn',
      'Mangelfull arkivering'
    ],
    isaReferences: ['ISA 700', 'ISA 701', 'ISA 260'],
    bestPractices: [
      'Sikre at beretningen er i tråd med ISA-standardene',
      'Avhold møte med styret for å gjennomgå funn',
      'Følg firmaets retningslinjer for arkivering'
    ]
  }
};
