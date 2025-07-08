
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  useAuditActionTemplatesBySubjectArea: () => ({ data: [] as any[], isLoading: false })
}));

vi.mock('@/services/revy/enhancedAiInteractionService', () => ({
  generateEnhancedAIResponseWithVariant: vi.fn().mockResolvedValue(
    JSON.stringify({
      name: 'AI-generert handling for Salg',
      description: 'desc',
      objective: 'obj',
      procedures: 'proc',
      documentation_requirements: 'docs',
      estimated_hours: 1,
      risk_level: 'low'
    })
  )
}));

vi.mock('@/hooks/audit-actions/useActionTemplateCRUD', () => ({
  useCreateAuditActionTemplate: () => ({ mutateAsync: vi.fn(), isPending: false })
}));

vi.mock('@/components/Auth/AuthProvider', () => ({
  useAuth: () => ({ session: { user: { id: '1' } } })
}));

import AuditActionGenerator from '../AuditActionGenerator';
import { createActionTemplateFormSchema } from '@/components/AuditActions/CreateActionTemplateForm/types';



describe('AuditActionGenerator', () => {
  it.skip('populates form data via handleGenerateWithAI', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuditActionGenerator />
      </QueryClientProvider>
    );

    // choose subject area
    fireEvent.pointerDown(screen.getAllByRole('combobox')[0]);
    await userEvent.click(screen.getByText('Salg'));

    // trigger AI generation
    await userEvent.click(screen.getByRole('button', { name: /AI Generator/i }));
    vi.runAllTimers();

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Navn på handlingen') as HTMLInputElement;
      expect(nameInput.value).toContain('AI-generert handling for');
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
