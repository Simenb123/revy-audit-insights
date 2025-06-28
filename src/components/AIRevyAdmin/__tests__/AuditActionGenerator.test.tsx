import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SubjectArea } from '@/types/classification';

// Mock hooks and dependencies
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

vi.mock('@/hooks/knowledge/useSubjectAreas', () => ({
  useSubjectAreas: () => ({
    data: [{ id: '1', name: 'sales', display_name: 'Salg' }] as SubjectArea[],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/knowledge/useAuditActionTemplates', () => ({
  useAuditActionTemplatesBySubjectArea: () => ({ data: [], isLoading: false })
}));

vi.mock('@/hooks/audit-actions/useActionTemplateCRUD', () => ({
  useCreateAuditActionTemplate: () => ({ mutateAsync: vi.fn(), isPending: false })
}));

vi.mock('@/components/Auth/AuthProvider', () => ({
  useAuth: () => ({ session: { user: { id: '1' } } })
}));

import AuditActionGenerator from '../AuditActionGenerator';
import { createActionTemplateFormSchema } from '@/components/AuditActions/CreateActionTemplateForm/types';

beforeEach(() => {
  vi.useFakeTimers();
});

describe('AuditActionGenerator', () => {
  it('populates form data via handleGenerateWithAI', async () => {
    render(<AuditActionGenerator />);

    // choose subject area
    await userEvent.click(screen.getByPlaceholderText('Velg fagområde'));
    await userEvent.click(screen.getByText('Salg'));

    // trigger AI generation
    await userEvent.click(screen.getByRole('button', { name: /AI Generator/i }));
    vi.runAllTimers();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Navn på handlingen')).toHaveValue(
        expect.stringContaining('AI-generert handling for')
      );
    });
  });

  it('rejects invalid action types', () => {
    const result = createActionTemplateFormSchema.safeParse({
      name: 'Test',
      subject_area: 'sales',
      action_type: 'invalid',
      procedures: 'p',
      risk_level: 'low',
      applicable_phases: ['execution'],
      sort_order: 0
    } as any);
    expect(result.success).toBe(false);
  });
});
