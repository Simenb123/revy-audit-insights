import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useReorderClientAuditActions,
  useBulkUpdateClientActionsStatus,
  useBulkDeleteClientActions
} from '../useClientActionBulk';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ error: null })
        })
      }),
      delete: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null })
      })
    }))
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  
  return Wrapper;
};

describe('useClientActionBulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useReorderClientAuditActions', () => {
    it('oppdaterer sort_order for flere actions', async () => {
      const { result } = renderHook(() => useReorderClientAuditActions(), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync({
        clientId: 'client-1',
        updates: [
          { id: '1', sort_order: 2 },
          { id: '2', sort_order: 1 }
        ]
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useBulkUpdateClientActionsStatus', () => {
    it('oppdaterer status for flere actions', async () => {
      const { result } = renderHook(() => useBulkUpdateClientActionsStatus(), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync({
        clientId: 'client-1',
        ids: ['1', '2', '3'],
        status: 'in_progress'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('viser error toast ved feil', async () => {
      // Mock error response
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: new Error('Database error') })
          })
        })
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => useBulkUpdateClientActionsStatus(), {
        wrapper: createWrapper()
      });

      await expect(
        result.current.mutateAsync({
          clientId: 'client-1',
          ids: ['1'],
          status: 'completed'
        })
      ).rejects.toThrow();
    });
  });

  describe('useBulkDeleteClientActions', () => {
    it('sletter flere actions', async () => {
      const { result } = renderHook(() => useBulkDeleteClientActions(), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync({
        clientId: 'client-1',
        ids: ['1', '2']
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
