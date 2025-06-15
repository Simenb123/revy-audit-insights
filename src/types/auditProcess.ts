
import { AuditPhase } from '@/types/revio';

export interface AuditProcessInsight {
  currentPhase: AuditPhase;
  nextSteps: string[];
  requiredActions: string[];
  riskAreas: string[];
  deadlines: Array<{ task: string; date: string; priority: 'high' | 'medium' | 'low' }>;
  completionRate: number;
  recommendations: string[];
}

export interface ProcessGuidance {
  phaseDescription: string;
  keyObjectives: string[];
  commonPitfalls: string[];
  isaReferences: string[];
  bestPractices: string[];
}
