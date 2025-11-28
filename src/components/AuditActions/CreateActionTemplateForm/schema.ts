import { z } from 'zod';

export const createActionTemplateSchema = z.object({
  phase: z.enum(['overview', 'engagement', 'planning', 'risk_assessment', 'execution', 'completion', 'reporting']),
  action_type: z.enum(['analytical', 'substantive', 'control_test', 'inquiry', 'observation', 'inspection', 'recalculation', 'confirmation']),
  name: z.string().min(1, 'Navn er påkrevd'),
  subject_area: z.string().min(1, 'Fagområde er påkrevd'),
  procedures: z.string().min(1, 'Handling er påkrevd'),
  response_fields: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'checkbox', 'checkbox_group']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional()
  })).optional(),
  include_comment_field: z.boolean().optional(),
  show_team_comments: z.boolean().optional()
});

export type CreateActionTemplateFormData = z.infer<typeof createActionTemplateSchema>;
