
// Type definitions for Revio application

// Context type for the Revy assistant
export type RevyContext = 
  | 'dashboard' 
  | 'drill-down' 
  | 'risk-assessment' 
  | 'documentation' 
  | 'mapping' 
  | 'client-overview'
  | 'client-admin'
  | 'general';

// Message structure for Revy chat
export interface RevyMessage {
  id: string;
  type: 'user' | 'revy';
  text: string;
}

// Risk level types
export type RiskLevel = 'low' | 'medium' | 'high' | 'none';

// Document version type
export type DocumentVersion = 'interim1' | 'interim2' | 'final' | 'revised';

// Audit phase types
export type AuditPhase = 'engagement' | 'planning' | 'execution' | 'conclusion';

// Client status type
export interface ClientStatus {
  client: string;
  phase: AuditPhase;
  progress: number; // 0-100
  riskAreas: {
    name: string;
    risk: RiskLevel;
  }[];
}

// Utvidet Client interface
export interface Client {
  id: string;
  name: string;
  orgNumber: string;
  phase: AuditPhase;
  progress: number; // 0-100
  department?: string;
  contactPerson?: string;
  chair?: string; // Styreleder
  ceo?: string; // Daglig leder
  industry?: string; // Bransje
  registrationDate?: string; // Stiftelsesdato
  lastUpdated?: string; // Sist oppdatert
  address?: string;
  postalCode?: string;
  city?: string;
  email?: string;
  phone?: string;
  bankAccount?: string;
  notes?: string;
  riskAreas: {
    name: string;
    risk: RiskLevel;
  }[];
  documents: {
    type: 'shareholder_report' | 'tax_return' | 'annual_report';
    status: 'pending' | 'submitted' | 'accepted';
    dueDate: string;
  }[];
}

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

// New types for accounting data
export interface AccountGroup {
  id: string;
  name: string;
  balance: number;
  prevBalance: number;
  accounts: Account[];
}

export interface Account {
  id: string;
  accountId: string;
  name: string;
  groupId: string;
  balance: number;
  prevBalance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  voucher: string;
  isSelected?: boolean;
  isTested?: boolean;
}

export interface AccountingVersion {
  id: string;
  name: DocumentVersion | string;
  date: string;
  description: string;
  isActive: boolean;
}

export interface VersionChange {
  id: string;
  versionId: string;
  accountId: string;
  accountName: string;
  previousAmount: number;
  newAmount: number;
  changeDate: string;
  changedBy: string;
}

// Transaction sampling types
export interface SamplingParams {
  amountMin?: number;
  amountMax?: number;
  dateFrom?: string;
  dateTo?: string;
  sampleSize: number;
  sampleType: 'random' | 'stratified' | 'systematic';
  accountId?: string;
}

export interface SamplingResult {
  transactions: Transaction[];
  summary: {
    totalCount: number;
    sampledCount: number;
    totalAmount: number;
    sampledAmount: number;
    coverage: number; // Percentage of total amount covered by sample
  };
}

// API interface for Brønnøysundregisteret
export interface BrregSearchResult {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: {
    kode: string;
    beskrivelse: string;
  };
  registreringsdatoEnhetsregisteret?: string;
  hjemmeside?: string;
  registrertIForetaksregisteret?: boolean;
  registrertIStiftelsesregisteret?: boolean;
  registrertIFrivillighetsregisteret?: boolean;
}

export interface BrregDetailedInfo {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: {
    kode: string;
    beskrivelse: string;
  };
  postadresse?: {
    adresse: string[];
    postnummer: string;
    poststed: string;
    land: string;
  };
  stiftelsesdato?: string;
  registreringsdatoEnhetsregisteret?: string;
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte?: number;
  forretningsadresse?: {
    adresse: string[];
    postnummer: string;
    poststed: string;
    land: string;
  };
  styre?: {
    rolle: string;
    navn: string;
  }[];
  dagligLeder?: {
    navn: string;
  };
}

export interface BrregAnnouncement {
  id: string;
  kunngjoringsdato: string;
  kunngjoringstype: string;
  organisasjonsnummer: string;
  beskrivelse: string;
}

