
export type AuditPhase = 'engagement' | 'planning' | 'execution' | 'conclusion';

export interface RiskArea {
  name: string;
  risk: 'low' | 'medium' | 'high';
}

export interface ClientDocument {
  type: 'shareholder_report' | 'tax_return' | 'annual_report';
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  dueDate: string;
}

export type RoleType = 'CEO' | 'CHAIR' | 'MEMBER' | 'SIGNATORY';

export interface ClientRole {
  id: string;
  clientId: string;
  roleType: RoleType;
  name: string;
  fromDate?: string;
  toDate?: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  orgNumber: string;
  phase: AuditPhase;
  progress: number;
  department?: string;
  contactPerson?: string;
  chair?: string;
  ceo?: string;
  industry?: string;
  registrationDate?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  email?: string;
  phone?: string;
  bankAccount?: string;
  notes?: string;
  riskAreas: RiskArea[];
  documents: ClientDocument[];
  
  // Enhanced Brønnøysund data
  orgFormCode?: string;
  orgFormDescription?: string;
  homepage?: string;
  status?: string;
  naceCode?: string;
  naceDescription?: string;
  municipalityCode?: string;
  municipalityName?: string;
  equityCapital?: number;
  shareCapital?: number;
  roles?: ClientRole[];
}

export interface BrregSearchResult {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: {
    kode: string;
    beskrivelse: string;
  };
  registreringsdatoEnhetsregisteret: string;
  hjemmeside?: string;
  registrertIForetaksregisteret: boolean;
  registrertIStiftelsesregisteret: boolean;
  registrertIFrivillighetsregisteret: boolean;
}

// Add missing type definitions

export interface Announcement {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  date: string;
  type: 'board_change' | 'capital_change' | 'address_change' | 'other';
  isRead: boolean;
}

export interface Account {
  id: string;
  accountId: string;
  name: string;
  groupId: string;
  balance: number;
  prevBalance: number;
}

export interface AccountGroup {
  id: string;
  name: string;
  balance: number;
  prevBalance: number;
  accounts: Account[];
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  voucher: string;
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

export type DocumentVersion = 'interim1' | 'interim2' | 'final' | 'revised';

export type RevyContext = 'general' | 'dashboard' | 'drill-down' | 'risk-assessment' | 'documentation' | 'mapping' | 'client-overview' | 'client-admin';

export interface RevyMessage {
  id: string;
  type: 'user' | 'revy';
  text: string;
}
