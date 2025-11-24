import { ActionType } from '@/types/audit-actions';
import { AuditPhase } from '@/types/revio';

// Mapping of audit phases to applicable action types
export const actionTypesByPhase: Record<AuditPhase, ActionType[]> = {
  overview: [],
  engagement: ['inquiry', 'inspection'],
  planning: ['analytical', 'inquiry'],
  risk_assessment: ['analytical', 'inquiry', 'observation'],
  execution: ['substantive', 'control_test', 'analytical', 'inspection', 'recalculation', 'confirmation'],
  completion: ['inquiry', 'analytical'],
  reporting: ['inspection', 'inquiry']
};

// Helper to get action types for a specific phase
export const getActionTypesForPhase = (phase: AuditPhase): ActionType[] => {
  return actionTypesByPhase[phase] || [];
};
