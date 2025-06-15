
import { Database } from "@/integrations/supabase/types";

export type RevyMessage = {
  id: string;
  sender: 'revy' | 'user';
  content: string | React.ReactNode;
};

// Re-added missing types to resolve build errors
export type BrregSearchResult = {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: {
    kode: string;
    beskrivelse: string;
  };
  registreringsdatoEnhetsregisteret?: string;
  hjemmeside?: string;
  registrertIForetaksregisteret: boolean;
  registrertIStiftelsesregisteret: boolean;
  registrertIFrivillighetsregisteret: boolean;
};

export type RiskArea = {
  name: string;
  risk: 'low' | 'medium' | 'high';
};

export type ClientDocument = {
  type: string;
  status: string;
  dueDate: string;
};

export type ClientRole = Database['public']['Tables']['client_roles']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'] & { isRead: boolean };

export type Account = { id: string; name: string; number: string; balance: number; type: string; };
export type AccountGroup = { id: string; name: string; accounts: Account[]; balance: number; };

// Unified audit phase type for frontend consistency
export type AuditPhase = 'overview' | 'engagement' | 'planning' | 'risk_assessment' | 'execution' | 'completion' | 'reporting';

// Extended client type for frontend use. It includes related data not on the client table itself.
type DbClient = Database['public']['Tables']['clients']['Row'];
export type Client = Omit<DbClient, 'phase'> & {
  phase: AuditPhase;
  riskAreas: RiskArea[];
  documents: ClientDocument[];
  roles: ClientRole[];
  announcements: Announcement[];
};

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

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  account: string;
};

export type SamplingResult = {
  sampleSize: number;
  populationSize: number;
  sampledItems: Transaction[];
  evaluation: string;
};
