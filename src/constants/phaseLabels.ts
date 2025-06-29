import type { AuditPhase } from '@/types/revio';

export const phaseLabels: Record<AuditPhase, string> = {
  overview: 'Oversikt',
  engagement: 'Oppdragsvurdering',
  planning: 'Planlegging',
  risk_assessment: 'Risikovurdering',
  execution: 'Utførelse',
  completion: 'Avslutning',
  reporting: 'Rapportering'
};
