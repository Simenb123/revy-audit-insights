
// Type definitions for Revio application

// Context type for the Revy assistant
export type RevyContext = 
  | 'dashboard' 
  | 'drill-down' 
  | 'risk-assessment' 
  | 'documentation' 
  | 'mapping' 
  | 'client-overview'
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

// New types for client overview
export interface Client {
  id: string;
  name: string;
  orgNumber: string;
  phase: AuditPhase;
  progress: number; // 0-100
  department?: string;
  contactPerson?: string;
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
