
import { RevyContext } from '@/types/revio';

export const getBasicContextualTip = (context: RevyContext): string => {
  const tips: Record<RevyContext, string> = {
    'dashboard': 'På dashboardet kan du se oversikt over klienter, oppgaver og fremdrift. Spør meg om KPI-er eller planlegging.',
    'client-overview': 'Her ser du alle dine klienter. Jeg kan hjelpe med å prioritere arbeid eller finne spesifikke klienter.',
    'client-detail': 'Jeg kan gi deg innsikt i denne klientens finansielle stilling, risikoområder og foreslå revisjonshandlinger.',
    'audit-actions': 'Jeg kan hjelpe med å planlegge revisjonshandlinger, forklare ISA-standarder og foreslå prosedyrer.',
    'risk-assessment': 'La meg hjelpe deg med risikovurdering etter ISA 315. Jeg kan forklare risikoområder og materialitetsvurderinger.',
    'documentation': 'Jeg kan veilede om dokumentasjonskrav etter ISA 230 og hjelpe med å strukturere arbeidspapirer.',
    'collaboration': 'Jeg kan hjelpe med teamorganisering, kommunikasjon og oppgavefordeling i revisjonsprosjekter.',
    'communication': 'Her kan jeg hjelpe med meldinger, møtenotater eller klientkommunikasjon.',
    'team-management': 'Som teamleder kan jeg hjelpe med kapasitetsplanlegging, kompetanseutvikling og teamdynamikk.',
    'drill-down': 'Jeg kan hjelpe deg med å analysere regnskapsdata og finne avvik eller mønstre som krever oppmerksomhet.',
    'mapping': 'Jeg kan veilede deg gjennom kontomapping og forklare hvordan regnskapskonti skal klassifiseres.',
    'accounting-data': 'Nå ser du på regnskapsdata. Spør meg om å analysere kontoer, finne transaksjoner eller sammenligne perioder.',
    'analysis': 'Analyse-siden er aktiv. Jeg kan hjelpe deg med å tolke grafer, beregne nøkkeltall eller identifisere trender.',
    'data-upload': 'Her kan du laste opp regnskapsdata. Jeg kan veilede deg gjennom prosessen eller hjelpe deg med filformater.',
    'knowledge-base': 'Du er i kunnskapsbasen. Søk etter artikler, ISA-standarder, eller spør meg om faglige temaer.',
    'knowledge': 'Jeg kan hjelpe deg med å finne og dele kunnskap om revisjonsmetodikk og faglige temaer.',
    'fag': 'Her kan jeg gi deg faglig veiledning om regnskaps- og revisjonsstandarder.',
    'general': 'Jeg kan hjelpe deg med revisjonsmetodikk, ISA-standarder, regnskapsanalyse eller appfunksjonalitet. Hva lurer du på?'
  };
  
  return tips[context] || tips.general;
};
