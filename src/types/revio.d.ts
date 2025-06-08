
export type AuditPhase = 'overview' | 'engagement' | 'planning' | 'execution' | 'conclusion';

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
  companyName: string;
  orgNumber: string;
  department: string;
  contactPerson: string;
  chair: string;
  ceo: string;
  industry: string;
  registrationDate: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  bankAccount: string;
  notes: string;
  phase: AuditPhase;
  progress: number;
  // Enhanced Brønnøysund data
  orgFormCode: string;
  orgFormDescription: string;
  homepage: string;
  status: string;
  naceCode: string;
  naceDescription: string;
  municipalityCode: string;
  municipalityName: string;
  equityCapital?: number | null;
  shareCapital?: number | null;
  // New extended fields
  accountingSystem: string;
  previousAuditor: string;
  auditFee?: number | null;
  yearEndDate: string;
  boardMeetingsPerYear?: number | null;
  internalControls: string;
  riskAssessment: string;
  // Test data flag
  isTestData?: boolean;
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
}

export type RevyContext = 'dashboard' | 'drill-down' | 'risk-assessment' | 'documentation' | 'mapping' | 'client-overview' | 'client-admin' | 'general';

