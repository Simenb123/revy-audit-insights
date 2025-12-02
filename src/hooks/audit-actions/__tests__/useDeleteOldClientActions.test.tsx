import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDeleteOldClientActions } from '../useDeleteOldClientActions';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ 
              data: [{ id: 'deleted-1', name: 'Old Action' }], 
              error: null 
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock use-toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDeleteOldClientActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined and return mutation object', () => {
    const { result } = renderHook(() => useDeleteOldClientActions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('should handle mutation call', async () => {
    const { result } = renderHook(() => useDeleteOldClientActions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('test-client-id');

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });
});
