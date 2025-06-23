
export type AuditPhase = 'overview' | 'engagement' | 'planning' | 'execution' | 'completion' | 'reporting';

export interface Client {
  id: string;
  name: string;
  phase: AuditPhase;
  // Add other client properties as needed
}
