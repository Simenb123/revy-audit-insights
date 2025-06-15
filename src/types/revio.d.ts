import { Database } from "@/integrations/supabase/types";

export type RevyMessage = {
  id: string;
  sender: 'revy' | 'user';
  content: string | React.ReactNode;
};

export type Client = Database['public']['Tables']['clients']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type ClientAuditAction = Database['public']['Tables']['client_audit_actions']['Row'];
export type DocumentVersion = Database['public']['Tables']['document_versions']['Row'];

export type PlanningModuleKey =
  | 'ANALYTICAL_REVIEW'
  | 'TEAM_DISCUSSION'
  | 'MANAGEMENT_INQUIRY'
  | 'OBSERVATION_INSPECTION'
  | 'GOING_CONCERN'
  | 'OPENING_BALANCE'
  | 'FRAUD_RISK'
  | 'ESTIMATES_PROFILE'
  | 'MATERIALITY'
  | 'RISK_MATRIX';

export interface PlanningModule {
  key: PlanningModuleKey;
  title: string;
  subtitle: string;
  number: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export type PlanningModuleStatus = Database['public']['Tables']['planning_module_statuses']['Row'];
export type PlanningMateriality = Database['public']['Tables']['planning_materiality']['Row'];
export type PlanningFraudRisk = Database['public']['Tables']['planning_fraud_risks']['Row'];
