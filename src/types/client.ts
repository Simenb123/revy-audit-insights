
import type { AuditPhase } from './revio';

export interface Client {
  id: string;
  name: string;
  phase: AuditPhase;
  // Add other client properties as needed
}
