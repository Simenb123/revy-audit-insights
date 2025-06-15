
export type AuditPhase = 'overview' | 'engagement' | 'planning' | 'risk_assessment' | 'execution' | 'completion';

// Update AuditSubjectArea to match what the database/components expect
export type AuditSubjectArea = 'sales' | 'payroll' | 'operating_expenses' | 'inventory' | 'finance' | 'banking' | 'fixed_assets' | 'receivables' | 'payables' | 'equity' | 'other';

export interface RiskArea {
  name: string;
  risk: 'low' | 'medium' | 'high';
}

export interface ClientDocument {
  type: 'tax_return' | 'annual_report' | 'other' | 'shareholder_report';
  status: 'pending' | 'completed' | 'overdue' | 'submitted' | 'accepted' | 'rejected';
  dueDate: string;
}

export interface ClientRole {
  id: string;
  clientId: string;
  roleType: 'CEO' | 'CHAIR' | 'MEMBER';
  name: string;
  fromDate: string | null;
  toDate: string | null;
}

export interface Announcement {
  id: string;
  clientId: string;
  type: string;
  title: string;
  url: string;
  date: string; // ISO-sträng ala "2024-12-31"
  isRead: boolean;
}

export interface Client {
  id: string;
  name: string;
  company_name: string;
  org_number: string;
  department: string;
  contact_person: string;
  chair: string;
  ceo: string;
  industry: string;
  registration_date: string;
  address: string;
  postal_code: string;
  city: string;
  email: string;
  phone: string;
  bank_account: string;
  notes: string;
  phase: AuditPhase;
  progress: number;
  // Enhanced Brønnøysund data
  org_form_code: string;
  org_form_description: string;
  homepage: string;
  status: string;
  nace_code: string;
  nace_description: string;
  municipality_code: string;
  municipality_name: string;
  equity_capital?: number | null;
  share_capital?: number | null;
  // New extended fields
  accounting_system: string;
  previous_auditor: string;
  audit_fee?: number | null;
  year_end_date: string;
  board_meetings_per_year?: number | null;
  internal_controls: string;
  risk_assessment: string;
  // Test data flag
  is_test_data?: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
  // Relationships
  riskAreas: RiskArea[];
  documents: ClientDocument[];
  roles: ClientRole[];
  announcements?: Announcement[];
}

// Add BrregSearchResult interface
export interface BrregSearchResult {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: {
    kode: string;
    beskrivelse: string;
  };
  registreringsdatoEnhetsregisteret: string;
  hjemmeside?: string;
  registrertIForetaksregisteret?: boolean;
  registrertIStiftelsesregisteret?: boolean;
  registrertIFrivillighetsregisteret?: boolean;
}

// Add missing types for Data Analysis components
export interface Account {
  id: string;
  name: string;
  number: string;
  balance: number;
  type: string;
  groupId: string;
}

export interface AccountGroup {
  id: string;
  name: string;
  accounts: Account[];
  balance: number;
}

export interface DocumentVersion {
  id: string;
  name: string;
  date: string;
  status: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  account: string;
  voucher?: string;
  isTested?: boolean;
}

export interface SamplingResult {
  transactions: Transaction[];
  summary: {
    totalCount: number;
    sampledCount: number;
    totalAmount: number;
    sampledAmount: number;
    coverage: number;
  };
}

export interface RevyMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'revy';
  enhanced?: {
    content: string;
    links: Array<{
      type: 'navigation' | 'action' | 'external' | 'knowledge';
      text: string;
      path?: string;
      url?: string;
      action?: () => void;
      icon?: React.ReactNode;
      variant?: 'default' | 'secondary' | 'outline';
    }>;
    sources: Array<{
      title: string;
      type: 'isa' | 'regulation' | 'knowledge' | 'client';
      reference?: string;
      url?: string;
    }>;
  };
}

export type RevyContext = 
  | 'dashboard' 
  | 'drill-down' 
  | 'risk-assessment' 
  | 'documentation' 
  | 'mapping' 
  | 'client-overview' 
  | 'client-detail'
  | 'collaboration'
  | 'communication'
  | 'audit-actions'
  | 'team-management'
  | 'general';

// AI Usage Types
export interface AIUsageLog {
  id: string;
  user_id: string;
  session_id?: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  request_type: string;
  context_type?: string;
  client_id?: string;
  response_time_ms?: number;
  error_message?: string;
  created_at: string;
}

export interface AIUsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  modelUsage: Record<string, number>;
  contextUsage: Record<string, number>;
}

export interface AIUsageStats {
  logs: AIUsageLog[];
  summary: AIUsageSummary;
}

// Knowledge Base Integration Types
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  category_id: string;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface EnhancedRevyContext {
  userContext: {
    role: string;
    department?: string;
    firm?: string;
  };
  clientContext?: {
    id: string;
    name: string;
    phase: AuditPhase;
    riskAreas: RiskArea[];
    activeActions: any[];
  };
  knowledgeContext?: KnowledgeArticle[];
  sessionContext: {
    sessionId: string;
    previousMessages: RevyMessage[];
  };
}
