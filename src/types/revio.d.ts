
export type AuditPhase = 'engagement' | 'planning' | 'execution' | 'conclusion';

export interface RiskArea {
  name: string;
  risk: 'low' | 'medium' | 'high';
}

export interface ClientDocument {
  type: 'annual_report' | 'tax_return' | 'other';
  status: 'pending' | 'completed' | 'overdue';
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
  announcement_id: string;
  client_id: string;
  org_number: string;
  announcement_date: string;
  title: string;
  type: string;
  normalized_type: string;
  details_url: string;
  kid: string;
  created_at: string;
  isRead?: boolean;
  clientName?: string;
  date?: string;
  description?: string;
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
  equityCapital?: number;
  shareCapital?: number;
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
}

export interface AccountGroup {
  id: string;
  name: string;
  accounts: Account[];
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
}

export interface SamplingResult {
  id: string;
  name: string;
  transactions: Transaction[];
}

export interface RevyMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'revy';
}

export interface RevyContext {
  context: string;
  setContext: (context: string) => void;
}
