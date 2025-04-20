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
