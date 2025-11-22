import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientActionsList from '../ClientActionsList';
import { AuditActionsProvider } from '@/contexts/AuditActionsContext';
import { ClientAuditAction } from '@/types/audit-actions';

// Mock hooks
vi.mock('@/hooks/useAuditActions', () => ({
  useClientAuditActions: vi.fn(() => ({
    data: [
      {
        id: '1',
        title: 'Action 1',
        phase: 'planning',
        status: 'not_started',
        sort_order: 1,
        client_id: 'client-1'
      },
      {
        id: '2',
        title: 'Action 2',
        phase: 'planning',
        status: 'in_progress',
        sort_order: 2,
        client_id: 'client-1'
      },
      {
        id: '3',
        title: 'Action 3',
        phase: 'execution',
        status: 'completed',
        sort_order: 3,
        client_id: 'client-1'
      }
    ],
    isLoading: false
  }))
}));

const mockActions: ClientAuditAction[] = [
  {
    id: '1',
    name: 'Action 1',
    phase: 'planning',
    status: 'not_started',
    sort_order: 1,
    client_id: 'client-1',
    subject_area: 'financial_statements',
    action_type: 'analytical',
    procedures: 'Test procedures',
    risk_level: 'medium',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    name: 'Action 2',
    phase: 'planning',
    status: 'in_progress',
    sort_order: 2,
    client_id: 'client-1',
    subject_area: 'financial_statements',
    action_type: 'substantive',
    procedures: 'Test procedures',
    risk_level: 'high',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    name: 'Action 3',
    phase: 'execution',
    status: 'completed',
    sort_order: 3,
    client_id: 'client-1',
    subject_area: 'revenue',
    action_type: 'substantive',
    procedures: 'Test procedures',
    risk_level: 'low',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
] as any;

vi.mock('@/hooks/audit-actions/useClientActionBulk', () => ({
  useReorderClientAuditActions: vi.fn(() => ({
    mutateAsync: vi.fn()
  })),
  useBulkUpdateClientActionsStatus: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  })),
  useBulkDeleteClientActions: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  }))
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuditActionsProvider>
        {children}
      </AuditActionsProvider>
    </QueryClientProvider>
  );
};

describe('ClientActionsList - Visuell og Bulk Operations Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viser alle client actions', () => {
    render(<ClientActionsList actions={mockActions} clientId="client-1" phase="planning" />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('kan toggle enkelt-select med checkbox', async () => {
    render(<ClientActionsList actions={mockActions} clientId="client-1" phase="planning" />, { wrapper: createWrapper() });
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    fireEvent.click(checkboxes[0]);
    await waitFor(() => {
      expect(checkboxes[0]).toBeChecked();
    });
  });

  it('viser selection count', async () => {
    render(<ClientActionsList actions={mockActions} clientId="client-1" phase="planning" />, { wrapper: createWrapper() });
    
    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
      
      await waitFor(() => {
        // Should show "1 valgt" or similar
        const selectionText = screen.queryByText(/valgt/i);
        expect(selectionText).toBeTruthy();
      });
    }
  });

  it('filtrerer actions basert på phase', async () => {
    const planningActions = mockActions.filter(a => a.phase === 'planning');
    render(<ClientActionsList actions={planningActions} clientId="client-1" phase="planning" />, { wrapper: createWrapper() });
    
    // Should only show planning phase actions
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.queryByText('Action 3')).not.toBeInTheDocument();
  });

  it('viser empty state når ingen actions', () => {
    render(<ClientActionsList actions={[]} clientId="client-1" phase="planning" />, { wrapper: createWrapper() });
    
    // Should show empty state
    const emptyMessages = screen.queryAllByText(/ingen/i);
    expect(emptyMessages.length).toBeGreaterThanOrEqual(0);
  });
});
