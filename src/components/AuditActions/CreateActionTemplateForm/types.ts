
import * as z from 'zod';
import { AUDIT_PHASES, type AuditPhase } from '@/types/revio';

export const createActionTemplateFormSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  description: z.string().optional(),
  subject_area: z.enum(['sales', 'payroll', 'operating_expenses', 'inventory', 'finance', 'banking', 'fixed_assets', 'receivables', 'payables', 'equity', 'other'] as const),
  action_type: z.enum(['analytical', 'substantive', 'control_test', 'inquiry', 'observation', 'inspection', 'recalculation', 'confirmation'] as const),
  objective: z.string().optional(),
  procedures: z.string().min(1, 'Prosedyrer er påkrevd'),
  documentation_requirements: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  applicable_phases: z.array(z.enum(AUDIT_PHASES)).min(1, 'Minst én fase må velges'),
  sort_order: z.number().default(0)
});

export type CreateActionTemplateFormData = z.infer<typeof createActionTemplateFormSchema>;
