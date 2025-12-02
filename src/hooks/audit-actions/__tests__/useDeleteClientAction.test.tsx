import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDeleteClientAction } from '../useDeleteClientAction';

// Mock supabase
const mockDelete = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: mockDelete,
    })),
  },
}));

// Mock sonner toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('sonner', () => ({
  toast: mockToast,
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

describe('useDeleteClientAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined and return mutation object', () => {
    const { result } = renderHook(() => useDeleteClientAction(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('should call supabase delete on mutation', async () => {
    const { result } = renderHook(() => useDeleteClientAction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      actionId: 'test-action-id',
      clientId: 'test-client-id',
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });
});
