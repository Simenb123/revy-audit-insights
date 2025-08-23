import type { AuditPhase } from '@/types/revio';
import { Info, Users, BookOpen, Target, FileText, Flag } from 'lucide-react';

export interface PhaseInfo {
  label: string;
  description: string;
  icon: any;
  color: string;
}

export const phaseInfo: Record<AuditPhase, PhaseInfo> = {
  overview: {
    label: 'Oversikt',
    description: '',
    icon: Info,
    color: 'bg-blue-100 text-blue-800'
  },
  engagement: {
    label: 'Oppdragsvurdering',
    description: 'Klientaksept, uavhengighetsvurdering og engasjementsbrev',
    icon: Users,
    color: 'bg-purple-100 text-purple-800'
  },
  planning: {
    label: 'Planlegging',
    description: 'Vesentlighetsgrense, revisjonsstrategi og risikovurdering',
    icon: BookOpen,
    color: 'bg-orange-100 text-orange-800'
  },
  risk_assessment: {
    label: 'Risikovurdering',
    description: 'Identifisering og vurdering av revisjonsrisiko',
    icon: Target,
    color: 'bg-yellow-100 text-yellow-800'
  },
  execution: {
    label: 'Utførelse',
    description: 'Revisjonshandlinger, testing og dokumentasjon',
    icon: Target,
    color: 'bg-green-100 text-green-800'
  },
  completion: {
    label: 'Avslutning',
    description: 'Rapporter, konklusjon og oppfølging',
    icon: Flag,
    color: 'bg-red-100 text-red-800'
  },
  reporting: {
    label: 'Rapportering',
    description: 'Ferdigstillelse av revisjonsrapport',
    icon: FileText,
    color: 'bg-gray-100 text-gray-800'
  }
};
