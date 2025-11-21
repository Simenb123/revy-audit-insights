/**
 * Badge utility functions for audit actions
 * Consolidates badge logic from multiple components
 */

import type { AuditSubjectArea, RiskLevel, ActionStatus } from '@/types/audit-actions';

export const getRiskBadgeVariant = (riskLevel: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
  switch (riskLevel) {
    case 'high':
    case 'critical':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const getRiskLabel = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'critical':
      return 'Kritisk risiko';
    case 'high':
      return 'Høy risiko';
    case 'medium':
      return 'Medium risiko';
    case 'low':
      return 'Lav risiko';
    default:
      return riskLevel;
  }
};

export const getComplexityBadgeVariant = (complexity: number): 'destructive' | 'default' | 'secondary' => {
  if (complexity <= 2) return 'secondary';
  if (complexity <= 3) return 'default';
  return 'destructive';
};

export const getComplexityLabel = (complexity: number): string => {
  if (complexity <= 2) return 'Enkel';
  if (complexity <= 3) return 'Moderat';
  return 'Kompleks';
};

export const getStatusBadgeVariant = (status: ActionStatus): 'secondary' | 'default' | 'outline' => {
  switch (status) {
    case 'not_started':
      return 'secondary';
    case 'in_progress':
      return 'default';
    case 'completed':
    case 'approved':
      return 'default';
    case 'reviewed':
      return 'outline';
    default:
      return 'secondary';
  }
};
