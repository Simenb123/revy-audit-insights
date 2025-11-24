/**
 * @deprecated Use string type directly. Subject areas are now data-driven from the database.
 * Use useSubjectAreaLabels() hook for dynamic labels.
 */
export type AuditSubjectArea = string;

// Legacy subject area keys for backward compatibility
export type LegacySubjectArea = 
  | 'sales'
  | 'payroll'
  | 'operating_expenses'
  | 'inventory'
  | 'finance'
  | 'banking'
  | 'fixed_assets'
  | 'receivables'
  | 'payables'
  | 'equity'
  | 'other';

export type ActionType = 
  | 'analytical'
  | 'substantive'
  | 'control_test'
  | 'inquiry'
  | 'observation'
  | 'inspection'
  | 'recalculation'
  | 'confirmation';

// Add the missing AuditActionType alias for backward compatibility
export type AuditActionType = ActionType;

// Add the missing RiskLevel type
export type RiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type ActionStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'reviewed'
  | 'approved';

import type { AuditPhase } from './revio';

export interface AuditActionTemplate {
  id: string;
  audit_firm_id?: string;
  created_by?: string;
  subject_area: AuditSubjectArea; // Legacy field for backward compatibility
  subject_area_id?: string; // Preferred: References subject_areas table
  action_type: ActionType;
  is_system_template: boolean;
  is_active: boolean;
  sort_order: number;
  group_id?: string;
  name: string;
  description?: string;
  objective?: string;
  procedures: string;
  documentation_requirements?: string;
  estimated_hours?: number;
  risk_level: string;
  applicable_phases: AuditPhase[];
  response_fields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'checkbox_group';
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  created_at: string;
  updated_at: string;
}

export interface ClientAuditAction {
  id: string;
  client_id: string;
  template_id?: string | null;
  assigned_to?: string | null;
  reviewed_by?: string | null;
  subject_area: AuditSubjectArea; // Legacy field for backward compatibility
  subject_area_id?: string | null; // Preferred: References subject_areas table
  action_type: ActionType;
  status: ActionStatus;
  phase: AuditPhase;
  sort_order: number;
  due_date?: string | null;
  completed_at?: string | null;
  reviewed_at?: string | null;
  actual_hours?: number | null;
  name: string;
  description?: string | null;
  objective?: string | null;
  procedures: string;
  documentation_requirements?: string | null;
  estimated_hours?: number | null;
  risk_level: string;
  findings?: string | null;
  conclusion?: string | null;
  work_notes?: string | null;
  // Newly supported working paper fields
  working_paper_template_id?: string | null;
  working_paper_data?: any;
  auto_metrics?: any;
  created_at: string;
  updated_at: string;
  copied_from_client_id?: string | null;
  copied_from_action_id?: string | null;
}

export interface ActionGroup {
  id: string;
  audit_firm_id?: string;
  created_by?: string;
  subject_area: AuditSubjectArea;
  is_system_group: boolean;
  sort_order: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated Use useSubjectAreaLabels() hook instead for dynamic, data-driven labels
 * This is kept for backward compatibility only
 */
export const SUBJECT_AREA_LABELS: Record<LegacySubjectArea, string> = {
  sales: 'Salg',
  payroll: 'Lønn',
  operating_expenses: 'Driftskostnader',
  inventory: 'Varelager',
  finance: 'Finans',
  banking: 'Bank',
  fixed_assets: 'Anleggsmidler',
  receivables: 'Kundefordringer',
  payables: 'Leverandørgjeld',
  equity: 'Egenkapital',
  other: 'Annet'
};


export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  analytical: 'Analytisk',
  substantive: 'Substansiell',
  control_test: 'Kontrolltest',
  inquiry: 'Forespørsel',
  observation: 'Observasjon',
  inspection: 'Inspeksjon',
  recalculation: 'Omregning',
  confirmation: 'Bekreftelse'
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  not_started: 'Ikke startet',
  in_progress: 'Pågår',
  completed: 'Fullført',
  reviewed: 'Gjennomgått',
  approved: 'Godkjent'
};
