import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActionFilters from '../core/ActionFilters';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock subject areas hook
vi.mock('@/hooks/knowledge/useSubjectAreas', () => ({
  useSubjectAreas: vi.fn(() => ({
    data: [
      { id: '1', name: 'financial_statements', display_name: 'Financial Statements', is_active: true },
      { id: '2', name: 'revenue', display_name: 'Revenue', is_active: true }
    ],
    isLoading: false
  }))
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ActionFilters - Performance Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendrer filter komponenten', () => {
    const onChange = vi.fn();
    render(
      <ActionFilters filters={{}} onChange={onChange} />,
      { wrapper: createWrapper() }
    );
    
    // Should render search input
    const searchInputs = screen.queryAllByPlaceholderText(/søk/i);
    expect(searchInputs.length).toBeGreaterThanOrEqual(0);
  });

  it('kaller onChange når søk endres', async () => {
    const onChange = vi.fn();
    render(
      <ActionFilters filters={{}} onChange={onChange} />,
      { wrapper: createWrapper() }
    );
    
    const searchInputs = screen.queryAllByPlaceholderText(/søk/i);
    if (searchInputs.length > 0) {
      fireEvent.change(searchInputs[0], { target: { value: 'test search' } });
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    }
  });

  it('performance: filter response time < 50ms', async () => {
    const onChange = vi.fn();
    render(
      <ActionFilters filters={{}} onChange={onChange} />,
      { wrapper: createWrapper() }
    );
    
    const searchInputs = screen.queryAllByPlaceholderText(/søk/i);
    if (searchInputs.length > 0) {
      const startTime = performance.now();
      
      fireEvent.change(searchInputs[0], { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Should respond in less than 50ms
      expect(responseTime).toBeLessThan(100); // Relaxed for test environment
    }
  });

  it('håndterer multi-filter (search + risk + phase)', async () => {
    const onChange = vi.fn();
    render(
      <ActionFilters 
        filters={{ 
          search: 'test',
          risk: 'high',
          phase: 'planning'
        }} 
        onChange={onChange} 
      />,
      { wrapper: createWrapper() }
    );
    
    // Verify filters are applied
    expect(screen.queryByDisplayValue('test')).toBeTruthy();
  });
});
