
export interface Client {
  id: string;
  name: string;
  company_name?: string;
  org_number?: string;
  industry?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  phase?: 'engagement' | 'planning' | 'execution' | 'completion' | 'reporting' | 'overview' | 'risk_assessment';
  tags?: string[];
  is_test_data?: boolean;
  // Additional properties from database
  user_id?: string;
  progress?: number;
  department?: string;
  contact_person?: string;
  chair?: string;
  ceo?: string;
  registration_date?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  email?: string;
  phone?: string;
  bank_account?: string;
  notes?: string;
  org_form_code?: string;
  org_form_description?: string;
  homepage?: string;
  status?: string;
  nace_code?: string;
  nace_description?: string;
  municipality_code?: string;
  municipality_name?: string;
  equity_capital?: number;
  share_capital?: number;
  accounting_system?: string;
  previous_auditor?: string;
  year_end_date?: string;
  internal_controls?: string;
  risk_assessment?: string;
  audit_fee?: number;
  board_meetings_per_year?: number;
  department_id?: string;
  // Relations
  riskAreas?: RiskArea[];
  documents?: ClientDocument[];
  roles?: ClientRole[];
  announcements?: Announcement[];
}

export interface RevyMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;  // Changed from string | React.ReactNode to just string
  timestamp: Date;
  metadata?: {
    context?: string;
    variant?: string;
    tokens?: number;
  };
}

export interface SearchResult {
  id: string;
  fileName: string;
  category: string;
  summary: string;
  confidence: number;
  relevantText?: string;
  uploadDate: string;
  document: {
    id: string;
    file_name: string;
    file_path: string;
    category: string;
    ai_confidence_score?: number;
    created_at: string;
  };
  relevanceScore: number;
  matchReasons: string[];
  suggestedActions?: string[];
}

export interface SearchSuggestion {
  query: string;
  category: string;
  confidence: number;
  icon?: string;
  description?: string;
  estimatedResults?: number;
}

export interface ClientAuditAction {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  subject_area?: string;
}

export interface Announcement {
  id: string;
  client_id: string;
  title: string;
  type: string;
  url: string;
  date: string;
  created_at?: string;
  is_read?: boolean;
  isRead?: boolean;
}

export interface BrregSearchResult {
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
}

// Use string literal type instead of enum for better compatibility
export type AuditPhase = 'overview' | 'engagement' | 'planning' | 'risk_assessment' | 'execution' | 'completion' | 'reporting';

export const AUDIT_PHASES: AuditPhase[] = ['overview', 'engagement', 'planning', 'risk_assessment', 'execution', 'completion', 'reporting'];

export interface RiskArea {
  name: string;
  risk: 'low' | 'medium' | 'high';
}

export interface ClientDocument {
  type: string;
  status: string;
  dueDate: string;
}

export interface ClientRole {
  id: string;
  client_id: string;
  name: string;
  role_type: string;
  from_date?: string;
  to_date?: string;
}

export interface DocumentVersion {
  id: string;
  client_audit_action_id: string;
  created_by_user_id?: string;
  created_at: string;
  content: string;
  version_name: string;
  change_source: string;
  change_description?: string;
}

export interface PlanningModuleStatus {
  id: string;
  client_id: string;
  module_key: string;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

// Re-export types from revio.d.ts for compatibility
export type RevyContext = 'dashboard' | 'client-overview' | 'client-detail' | 'audit-actions' | 'risk-assessment' | 'documentation' | 'collaboration' | 'communication' | 'team-management' | 'drill-down' | 'mapping' | 'general' | 'accounting-data' | 'analysis' | 'data-upload' | 'knowledge-base';

export type RevyChatSession = {
  id: string;
  user_id: string;
  client_id: string | null;
  created_at: string;
  updated_at: string;
  title: string | null;
  context: string | null;
};

export type RevyChatMessage = {
  id: string;
  session_id: string;
  sender: 'user' | 'revy';
  content: string;
  metadata?: any;
  created_at: string;
};

export interface ProactiveAction {
  type: 'navigation' | 'action' | 'external' | 'knowledge';
  text: string;
  path?: string;
  url?: string;
  action?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
}

export type Account = {
  id: string;
  name: string;
  number: string;
  balance: number;
  type: 'asset' | 'liability' | 'equity';
};

export type AccountGroup = { 
  id: string; 
  name: string; 
  accounts: Account[]; 
  balance: number; 
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  account: string;
  voucher: string;
  isTested?: boolean;
};

export type SamplingResult = {
  transactions: Transaction[];
  summary: {
    totalCount: number;
    sampledCount: number;
    totalAmount: number;
    sampledAmount: number;
    coverage: number;
  };
};

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
