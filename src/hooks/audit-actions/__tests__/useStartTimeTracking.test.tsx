import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStartTimeTracking } from '../useStartTimeTracking';
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

describe('useStartTimeTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('oppdaterer action til in_progress status', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'action-1', status: 'in_progress' },
            error: null
          })
        }))
      }))
    }));
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useStartTimeTracking(), {
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
        status: 'in_progress',
        updated_at: expect.any(String),
        work_notes: expect.stringContaining('Startet:')
      })
    );
  });

  it('legger til timestamp i work_notes', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'action-1', status: 'in_progress' },
            error: null
          })
        }))
      }))
    }));
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useStartTimeTracking(), {
      wrapper: createWrapper()
    });

    result.current.mutate({
      actionId: 'action-1',
      clientId: 'client-1'
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalled();
    const calls = (mockUpdate.mock.calls as any[][]); 
    expect(calls.length).toBeGreaterThan(0);
    const updateCall = calls[0][0];
    expect(updateCall?.work_notes).toMatch(/Startet: \d{1,2}\.\d{1,2}\.\d{4}/);
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

    const { result } = renderHook(() => useStartTimeTracking(), {
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

  it('viser success toast etter vellykket start', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'action-1', status: 'in_progress' },
            error: null
          })
        }))
      }))
    }));
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any);

    const { result } = renderHook(() => useStartTimeTracking(), {
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
        title: 'Tidregistrering startet'
      })
    );
  });
});
