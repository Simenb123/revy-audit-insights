import { CheckCircle, Clock, Play, Pause, Award } from 'lucide-react';

export const ACTION_STATUS_CONFIG = {
  not_started: {
    label: 'Ikke startet',
    variant: 'secondary' as const,
    icon: Pause,
    color: 'text-muted-foreground'
  },
  in_progress: {
    label: 'Pågående',
    variant: 'default' as const,
    icon: Play,
    color: 'text-primary'
  },
  completed: {
    label: 'Fullført',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600'
  },
  reviewed: {
    label: 'Under gjennomgang',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-orange-600'
  },
  approved: {
    label: 'Godkjent',
    variant: 'default' as const,
    icon: Award,
    color: 'text-green-600'
  }
} as const;

export const RISK_LEVEL_CONFIG = {
  low: {
    label: 'Lav',
    color: 'text-green-600',
    variant: 'secondary' as const
  },
  medium: {
    label: 'Medium',
    color: 'text-orange-600',
    variant: 'secondary' as const
  },
  high: {
    label: 'Høy',
    color: 'text-destructive',
    variant: 'destructive' as const
  },
  critical: {
    label: 'Kritisk',
    color: 'text-destructive',
    variant: 'destructive' as const
  }
} as const;

export const ACTION_TYPE_CONFIG = {
  analytical: 'Analytiske',
  substantive: 'Substanshandlinger',
  control_test: 'Kontrolltest',
  inquiry: 'Forespørsel',
  observation: 'Observasjon',
  inspection: 'Inspeksjon',
  recalculation: 'Rekalkulasjon',
  confirmation: 'Bekreftelse'
} as const;

export type ActionStatus = keyof typeof ACTION_STATUS_CONFIG;
export type RiskLevel = keyof typeof RISK_LEVEL_CONFIG;
export type ActionTypeKey = keyof typeof ACTION_TYPE_CONFIG;
