
export type { AuditProcessInsight, ProcessGuidance } from '@/types/auditProcess';

export { analyzeAuditProcess } from './auditProcess/analysis';
export { getPhaseGuidance, generateContextualRecommendations } from './auditProcess/guidance';
