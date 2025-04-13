
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
