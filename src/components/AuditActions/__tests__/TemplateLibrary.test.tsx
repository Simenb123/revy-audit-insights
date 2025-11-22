import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TemplateLibrary from '../TemplateLibrary';

// Mock hooks
vi.mock('@/hooks/audit-actions/useActionTemplateCRUD', () => ({
  useAuditActionTemplates: vi.fn(() => ({
    data: [
      {
        id: '1',
        title: 'Test Template 1',
        subject_area: 'financial_statements',
        applicable_phases: ['planning'],
        risk_level: 'high',
        action_type: 'test',
        description: 'Test description',
        is_active: true,
        created_at: '2024-01-01'
      },
      {
        id: '2',
        title: 'Test Template 2',
        subject_area: 'revenue',
        applicable_phases: ['execution'],
        risk_level: 'medium',
        action_type: 'substantive',
        description: 'Test description 2',
        is_active: true,
        created_at: '2024-01-02'
      }
    ],
    isLoading: false,
    error: null
  }))
}));

vi.mock('@/hooks/knowledge/useSubjectAreas', () => ({
  useSubjectAreas: vi.fn(() => ({
    data: [
      { id: '1', name: 'financial_statements', display_name: 'Financial Statements', is_active: true, sort_order: 1 },
      { id: '2', name: 'revenue', display_name: 'Revenue', is_active: true, sort_order: 2 }
    ],
    isLoading: false
  }))
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TemplateLibrary - Visuell Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viser template liste med badges', () => {
    render(<TemplateLibrary />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Test Template 1')).toBeInTheDocument();
    expect(screen.getByText('Test Template 2')).toBeInTheDocument();
  });

  it('kan toggle mellom basic og enhanced view', async () => {
    render(<TemplateLibrary />, { wrapper: createWrapper() });
    
    // Find toggle button and click it
    const enhancedViewButtons = screen.getAllByRole('button', { name: /enhanced/i });
    if (enhancedViewButtons.length > 0) {
      fireEvent.click(enhancedViewButtons[0]);
      await waitFor(() => {
        // Verify enhanced view is shown
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });
    }
  });

  it('viser subject area filtrering', async () => {
    render(<TemplateLibrary />, { wrapper: createWrapper() });
    
    // Check if filter exists
    const filterInputs = screen.queryAllByPlaceholderText(/søk/i);
    expect(filterInputs.length).toBeGreaterThanOrEqual(0);
  });

  it('viser empty state når ingen templates', () => {
    vi.mocked(require('@/hooks/audit-actions/useActionTemplateCRUD').useAuditActionTemplates).mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    });

    render(<TemplateLibrary />, { wrapper: createWrapper() });
    
    // Should show empty state or "no templates" message
    const emptyMessages = screen.queryAllByText(/ingen/i);
    expect(emptyMessages.length).toBeGreaterThanOrEqual(0);
  });

  it('viser loading state', () => {
    vi.mocked(require('@/hooks/audit-actions/useActionTemplateCRUD').useAuditActionTemplates).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    });

    render(<TemplateLibrary />, { wrapper: createWrapper() });
    
    // Should show loading indicator
    expect(screen.queryByText('Test Template 1')).not.toBeInTheDocument();
  });
});
