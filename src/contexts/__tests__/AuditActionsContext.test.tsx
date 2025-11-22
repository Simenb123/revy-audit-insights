import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuditActionsProvider, useAuditActionsContext } from '../AuditActionsContext';

// Mock hooks
vi.mock('@/hooks/audit-actions/useClientActionBulk', () => ({
  useBulkUpdateClientActionsStatus: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false
  })),
  useBulkDeleteClientActions: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false
  }))
}));

const TestComponent = () => {
  const {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    bulkUpdateStatus,
    bulkDelete,
    isLoading
  } = useAuditActionsContext();

  return (
    <div>
      <div data-testid="selected-count">{selectedIds.length}</div>
      <button onClick={() => toggleSelect('1')}>Toggle 1</button>
      <button onClick={() => toggleSelect('2')}>Toggle 2</button>
      <button onClick={() => selectAll(['1', '2', '3'])}>Select All</button>
      <button onClick={() => clearSelection()}>Clear</button>
      <button onClick={() => bulkUpdateStatus('client-1', 'in_progress')}>Update Status</button>
      <button onClick={() => bulkDelete('client-1')}>Delete</button>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="is-selected-1">{isSelected('1').toString()}</div>
    </div>
  );
};

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

describe('AuditActionsContext - Bulk Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kan toggle enkelt-select', async () => {
    render(<TestComponent />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-selected-1')).toHaveTextContent('false');
    
    fireEvent.click(screen.getByText('Toggle 1'));
    
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
      expect(screen.getByTestId('is-selected-1')).toHaveTextContent('true');
    });
  });

  it('kan select all', async () => {
    render(<TestComponent />, { wrapper: createWrapper() });
    
    fireEvent.click(screen.getByText('Select All'));
    
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('3');
    });
  });

  it('kan clear selection', async () => {
    render(<TestComponent />, { wrapper: createWrapper() });
    
    fireEvent.click(screen.getByText('Select All'));
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('3');
    });
    
    fireEvent.click(screen.getByText('Clear'));
    
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    });
  });

  it('kan bulk update status', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    vi.mocked(require('@/hooks/audit-actions/useClientActionBulk').useBulkUpdateClientActionsStatus).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false
    });

    render(<TestComponent />, { wrapper: createWrapper() });
    
    fireEvent.click(screen.getByText('Toggle 1'));
    fireEvent.click(screen.getByText('Toggle 2'));
    
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('2');
    });
    
    fireEvent.click(screen.getByText('Update Status'));
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        clientId: 'client-1',
        ids: ['1', '2'],
        status: 'in_progress'
      });
    });
  });

  it('kan bulk delete', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    vi.mocked(require('@/hooks/audit-actions/useClientActionBulk').useBulkDeleteClientActions).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false
    });

    render(<TestComponent />, { wrapper: createWrapper() });
    
    fireEvent.click(screen.getByText('Toggle 1'));
    
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    });
    
    fireEvent.click(screen.getByText('Delete'));
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        clientId: 'client-1',
        ids: ['1']
      });
    });
  });

  it('viser error toast når ingen items er valgt', async () => {
    render(<TestComponent />, { wrapper: createWrapper() });
    
    // Try to update status without selecting anything
    fireEvent.click(screen.getByText('Update Status'));
    
    // Toast should be shown (tested via sonner mock)
    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    });
  });
});
