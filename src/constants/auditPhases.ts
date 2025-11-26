import type { AuditPhase } from '@/types/revio';
import type { Database } from '@/integrations/supabase/types';

type DbPhase = Database['public']['Enums']['audit_phase'];

/**
 * Unified phase configuration
 * Maps UI phases to database enum values
 */
export const PHASE_CONFIG: Record<AuditPhase, {
  dbValue: DbPhase;
  label: string;
  icon?: string;
  color?: string;
}> = {
  overview: {
    dbValue: 'engagement', // Maps to engagement in DB
    label: 'Oversikt',
    icon: '📊',
    color: 'slate',
  },
  engagement: {
    dbValue: 'engagement',
    label: 'Engasjement',
    icon: '🤝',
    color: 'blue',
  },
  planning: {
    dbValue: 'planning',
    label: 'Planlegging',
    icon: '📋',
    color: 'purple',
  },
  risk_assessment: {
    dbValue: 'planning', // Maps to planning in DB
    label: 'Risikovurdering',
    icon: '⚠️',
    color: 'orange',
  },
  execution: {
    dbValue: 'execution',
    label: 'Utførelse',
    icon: '⚙️',
    color: 'green',
  },
  completion: {
    dbValue: 'conclusion', // Maps to conclusion in DB
    label: 'Avslutning',
    icon: '✅',
    color: 'teal',
  },
  reporting: {
    dbValue: 'conclusion', // Maps to conclusion in DB
    label: 'Rapportering',
    icon: '📄',
    color: 'indigo',
  },
};

/**
 * Convert UI phase to database enum
 */
export const toDbPhase = (phase: AuditPhase): DbPhase => {
  return PHASE_CONFIG[phase].dbValue;
};

/**
 * Convert database enum to UI phase
 */
export const fromDbPhase = (dbPhase: DbPhase): AuditPhase => {
  // First, try to find an exact match (where key === dbValue)
  const exactMatch = Object.entries(PHASE_CONFIG).find(
    ([key, config]) => key === dbPhase && config.dbValue === dbPhase
  );
  if (exactMatch) {
    return exactMatch[0] as AuditPhase;
  }
  
  // Fallback to first match (for alias phases like overview, risk_assessment, etc.)
  const entry = Object.entries(PHASE_CONFIG).find(
    ([_, config]) => config.dbValue === dbPhase
  );
  return (entry?.[0] as AuditPhase) || 'execution';
};

/**
 * Get display label for a phase
 */
export const getPhaseLabel = (phase: AuditPhase | string): string => {
  return PHASE_CONFIG[phase as AuditPhase]?.label || phase;
};

/**
 * Get all available phases
 */
export const getAllPhases = (): AuditPhase[] => {
  return Object.keys(PHASE_CONFIG) as AuditPhase[];
};

/**
 * Check if a phase is valid
 */
export const isValidPhase = (phase: string): phase is AuditPhase => {
  return phase in PHASE_CONFIG;
};
