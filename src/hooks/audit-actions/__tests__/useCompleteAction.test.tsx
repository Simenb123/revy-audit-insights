import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCompleteAction } from '../useCompleteAction';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCompleteAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('oppdaterer action til completed status', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'action-1', status: 'completed' },
            error: null
          })
        }))
      }))
    }));
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useCompleteAction(), {
      wrapper: createWrapper()
    });

    result.current.mutate({
      actionId: 'action-1',
      clientId: 'client-1'
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        completed_at: expect.any(String),
        updated_at: expect.any(String)
      })
    );
  });

  it('inkluderer actual_hours når den er oppgitt', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'action-1', status: 'completed', actual_hours: 5 },
            error: null
          })
        }))
      }))
    }));
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useCompleteAction(), {
      wrapper: createWrapper()
    });

    result.current.mutate({
      actionId: 'action-1',
      clientId: 'client-1',
      actualHours: 5
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        actual_hours: 5
      })
    );
  });

  it('håndterer feil fra Supabase', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        }))
      }))
    }));
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useCompleteAction(), {
      wrapper: createWrapper()
    });

    result.current.mutate({
      actionId: 'action-1',
      clientId: 'client-1'
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('invaliderer queries etter vellykket oppdatering', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'action-1', status: 'completed' },
            error: null
          })
        }))
      }))
    }));
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useCompleteAction(), {
      wrapper: createWrapper()
    });

    result.current.mutate({
      actionId: 'action-1',
      clientId: 'client-1'
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const { toast } = await import('@/hooks/use-toast');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Handling fullført'
      })
    );
  });
});
