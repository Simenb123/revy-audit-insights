
import { PlanningModuleKey } from '@/types/revio';

export interface PlanningModuleInfo {
  key: PlanningModuleKey;
  title: string;
  subtitle: string;
  number: string;
}

export const planningModules: PlanningModuleInfo[] = [
  { key: 'ANALYTICAL_REVIEW', number: '2.1', title: 'Analytisk overordnet risikovurdering', subtitle: 'Påkrevd planleggingsanalyse (ISA 315.16)' },
  { key: 'TEAM_DISCUSSION', number: '2.2', title: 'Teamdiskusjon', subtitle: 'Felles forståelse av risiko (ISA 315.18, ISA 240.15)' },
  { key: 'MANAGEMENT_INQUIRY', number: '2.3', title: 'Forespørsler til ledelsen', subtitle: 'Innhente "soft information" (ISA 315.17)' },
  { key: 'OBSERVATION_INSPECTION', number: '2.4', title: 'Observasjon & inspeksjon', subtitle: 'Påkrevd handling (ISA 315.19-20)' },
  { key: 'GOING_CONCERN', number: '2.5', title: 'Going concern - foreløpig vurdering', subtitle: 'Tidlig varsling (ISA 570.10)' },
  { key: 'OPENING_BALANCE', number: '2.6', title: 'Åpningsbalanse', subtitle: 'Vurdering for nye/eksisterende klienter (ISA 510)' },
  { key: 'FRAUD_RISK', number: '2.7', title: 'Mislighetsmodul', subtitle: 'Spiss vurdering av fraud risk (ISA 240)' },
  { key: 'ESTIMATES_PROFILE', number: '2.8', title: 'Regnskapsestimater - risikoprofil', subtitle: 'Forbered ISA 540-krav' },
  { key: 'MATERIALITY', number: '2.9', title: 'Vesentlighet & arbeidsvesentlighet', subtitle: 'Fastsette terskler (ISA 320)' },
  { key: 'RISK_MATRIX', number: '2.10', title: 'Samlet risikomatrise & strategi', subtitle: 'Konsoliderer funn (ISA 315.34-37, ISA 330.5)' },
];
