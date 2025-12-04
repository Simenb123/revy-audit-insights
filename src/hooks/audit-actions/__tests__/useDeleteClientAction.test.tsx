import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDeleteClientAction } from '../useDeleteClientAction';

// Mock supabase
const mockEq = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: () => {
        mockDelete();
        return {
          eq: (col: string, val: string) => {
            mockEq(col, val);
            return Promise.resolve({ error: null });
          },
        };
      },
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

  describe('initialization', () => {
    it('should be defined and return mutation object', () => {
      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });

    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('mutation execution', () => {
    it('should call supabase delete on mutation', async () => {
      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          actionId: 'test-action-id',
          clientId: 'test-client-id',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'test-action-id');
    });

    it('should use mutateAsync correctly', async () => {
      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          actionId: 'async-action-id',
          clientId: 'async-client-id',
        });
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle multiple sequential deletions', async () => {
      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper: createWrapper(),
      });

      // First deletion
      await act(async () => {
        await result.current.mutateAsync({
          actionId: 'action-1',
          clientId: 'client-1',
        });
      });

      expect(result.current.isSuccess).toBe(true);

      // Second deletion
      await act(async () => {
        await result.current.mutateAsync({
          actionId: 'action-2',
          clientId: 'client-1',
        });
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('query invalidation', () => {
    it('should invalidate queries after successful deletion', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          actionId: 'test-action',
          clientId: 'test-client',
        });
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('toast notifications', () => {
    it('should show success toast on successful deletion', async () => {
      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          actionId: 'test-action',
          clientId: 'test-client',
        });
      });

      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty action ID', async () => {
      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          actionId: '',
          clientId: 'test-client',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should handle special characters in IDs', async () => {
      const { result } = renderHook(() => useDeleteClientAction(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          actionId: 'action-with-special-chars-123-abc',
          clientId: 'client-uuid-format',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });
  });
});
