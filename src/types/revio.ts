
export interface RevyMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  links?: Array<{
    type: 'navigation' | 'action' | 'external' | 'knowledge';
    text: string;
    path?: string;
    url?: string;
    action?: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'secondary' | 'outline';
  }>;
  sources?: Array<{
    title: string;
    type: 'isa' | 'regulation' | 'knowledge' | 'client';
    reference?: string;
    url?: string;
  }>;
}

export type RevyContext = 
  | 'dashboard'
  | 'client-overview'
  | 'client-detail'
  | 'audit-actions'
  | 'risk-assessment'
  | 'documentation'
  | 'collaboration'
  | 'communication'
  | 'team-management'
  | 'drill-down'
  | 'mapping'
  | 'general'
  | 'accounting-data'
  | 'analysis'
  | 'data-upload'
  | 'knowledge-base'
  | 'knowledge'
  | 'fag';

export interface RevyChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'revy';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface ProactiveAction {
  type: 'action' | 'navigation' | 'knowledge';
  text: string;
  path?: string;
  action?: () => void;
  variant?: 'default' | 'secondary' | 'outline';
}

// Base types for the application
export interface Client {
  id: string;
  company_name: string;
  name?: string;
  org_number?: string;
  industry?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  current_phase?: AuditPhase;
  progress?: number;
  risk_areas?: RiskArea[];
  roles?: ClientRole[];
  documents?: ClientDocument[];
  announcements?: Announcement[];
// Additional Brreg and client data fields
  phase?: AuditPhase;
  department?: string;
  chair?: string;
  ceo?: string;
  registration_date?: string;
  postal_code?: string;
  city?: string;
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
  is_test_data?: boolean;
  riskAreas?: RiskArea[]; // Alternative field name
  user_id?: string;
}

export type AuditPhase = 'engagement' | 'planning' | 'execution' | 'completion' | 'risk_assessment' | 'reporting' | 'overview';

export interface ClientRole {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  role_type: string;
  from_date?: string;
  to_date?: string;
}

export interface RiskArea {
  id?: string;
  name: string;
  description?: string;
  risk_level?: 'low' | 'medium' | 'high';
  client_id?: string;
  risk?: 'low' | 'medium' | 'high'; // Alternative field name
}

export interface ClientDocument {
  id?: string;
  filename?: string;
  file_type?: string;
  file_size?: number;
  upload_date?: string;
  client_id?: string;
  category?: string;
  ai_confidence?: number;
  type?: string;
  status?: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'completed' | 'draft';
  dueDate?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  created_at: string;
  client_id?: string;
  date?: string;
  isRead?: boolean;
  url?: string;
}

export interface ClientAuditAction {
  id: string;
  title: string;
  description?: string;
  phase: AuditPhase;
  status: 'not_started' | 'in_progress' | 'completed';
  client_id: string;
  estimated_hours?: number;
  actual_hours?: number;
  subject_area?: string;
  name?: string;
}

export interface BrregSearchResult {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: {
    kode: string;
    beskrivelse: string;
  };
  adresse?: {
    adresselinje1?: string;
    postnummer?: string;
    poststed?: string;
  };
  registreringsdatoEnhetsregisteret?: string;
  hjemmeside?: string;
  registrertIForetaksregisteret?: boolean;
  registrertIStiftelsesregisteret?: boolean;
  registrertIFrivillighetsregisteret?: boolean;
}

export interface PlanningModule {
  id: string;
  name: string;
  description: string;
  phase: AuditPhase;
  completed: boolean;
  key?: string;
  number?: number;
  title?: string;
  subtitle?: string;
  status?: string;
}

export type PlanningModuleKey = 'risk_assessment' | 'materiality' | 'internal_control' | 'audit_strategy' | 'ANALYTICAL_REVIEW' | 'TEAM_DISCUSSION' | 'MANAGEMENT_INQUIRY' | 'OBSERVATION_INSPECTION' | 'GOING_CONCERN' | 'OPENING_BALANCE' | 'FRAUD_RISK' | 'ESTIMATES_PROFILE' | 'MATERIALITY' | 'RISK_MATRIX';

export interface Account {
  id: string;
  account_number?: string;
  account_name?: string;
  balance?: number;
  account_type?: string;
  group_id?: string;
  name?: string;
  number?: string;
  type?: string;
}

export interface AccountGroup {
  id: string;
  name: string;
  accounts: Account[];
  balance?: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  account_id?: string;
  reference?: string;
  account?: string;
  voucher?: string;
  isTested?: boolean;
}

export interface SamplingResult {
  selected_transactions?: Transaction[];
  sampling_method?: string;
  confidence_level?: number;
  sample_size?: number;
  transactions?: Transaction[];
  summary?: {
    total_amount?: number;
    average_amount?: number;
    transaction_count?: number;
    tested_amount?: number;
    tested_percentage?: number;
    totalCount?: number;
    sampledCount?: number;
    totalAmount?: number;
    sampledAmount?: number;
    coveragePercentage?: number;
    coverage?: number;
  };
}

export interface DocumentVersion {
  id: string;
  version_number?: number;
  created_at: string;
  description?: string;
  file_path?: string;
  version_name?: string;
  client_audit_action_id?: string;
  change_source?: string;
  content?: string;
  created_by_user_id?: string;
  change_description?: string;
}

export interface RevyChatSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  messages: RevyChatMessage[];
  title?: string;
}
