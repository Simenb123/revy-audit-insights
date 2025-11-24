import { z } from 'zod';

const AUDIT_PHASES_ARRAY = ['overview', 'engagement', 'planning', 'risk_assessment', 'execution', 'completion', 'reporting'] as const;

export const createActionTemplateSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  description: z.string().optional(),
  subject_area: z.string().min(1, 'Fagområde er påkrevd'), // Data-driven from DB (ID)
  action_type: z.enum(['analytical', 'substantive', 'control_test', 'inquiry', 'observation', 'inspection', 'recalculation', 'confirmation'] as const),
  objective: z.string().optional(),
  procedures: z.string().min(1, 'Prosedyrer er påkrevd'),
  documentation_requirements: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  applicable_phases: z.array(z.enum(AUDIT_PHASES_ARRAY)).min(1, 'Minst én fase må velges'),
  sort_order: z.number().default(0),
  response_fields: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'checkbox', 'checkbox_group']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional()
  })).optional()
});

export type CreateActionTemplateFormData = z.infer<typeof createActionTemplateSchema>;
