export type AuditSubjectArea = 
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

export type ActionStatus = 
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'reviewed'
  | 'approved';

export type AuditPhase = 
  | 'engagement'
  | 'planning'
  | 'execution'
  | 'conclusion';

export interface AuditActionTemplate {
  id: string;
  audit_firm_id?: string;
  created_by?: string;
  subject_area: AuditSubjectArea;
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
  created_at: string;
  updated_at: string;
}

export interface ClientAuditAction {
  id: string;
  client_id: string;
  template_id?: string;
  assigned_to?: string;
  reviewed_by?: string;
  subject_area: AuditSubjectArea;
  action_type: ActionType;
  status: ActionStatus;
  phase: AuditPhase;
  sort_order: number;
  due_date?: string;
  completed_at?: string;
  reviewed_at?: string;
  actual_hours?: number;
  name: string;
  description?: string;
  objective?: string;
  procedures: string;
  documentation_requirements?: string;
  estimated_hours?: number;
  risk_level: string;
  findings?: string;
  conclusion?: string;
  work_notes?: string;
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

export const SUBJECT_AREA_LABELS: Record<AuditSubjectArea, string> = {
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
