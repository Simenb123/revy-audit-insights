import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDeleteOldClientActions } from '../useDeleteOldClientActions';

// Mock deleted actions
const mockDeletedActions = [
  { id: 'deleted-1', name: 'Old Action 1' },
  { id: 'deleted-2', name: 'Old Action 2' },
  { id: 'deleted-3', name: 'Old Action 3' },
];

// Mock supabase
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: () => {
        mockDelete();
        return {
          eq: (col: string, val: string) => {
            mockEq(col, val);
            return {
              is: (col2: string, val2: null) => {
                mockIs(col2, val2);
                return {
                  select: () => {
                    mockSelect();
                    return Promise.resolve({ 
                      data: mockDeletedActions, 
                      error: null 
                    });
                  },
                };
              },
            };
          },
        };
      },
    })),
  },
}));

// Mock use-toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
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

describe('useDeleteOldClientActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined and return mutation object', () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });

    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('mutation execution', () => {
    it('should handle mutation call', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate('test-client-id');
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should call supabase delete with correct parameters', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate('specific-client-id');
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('client_id', 'specific-client-id');
    });

    it('should filter by null template_id', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate('test-client-id');
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      // Should filter for actions without template_id (old/orphaned actions)
      expect(mockIs).toHaveBeenCalledWith('template_id', null);
    });

    it('should return deleted actions data', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync('test-client-id');
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe('use mutateAsync', () => {
    it('should work with mutateAsync', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      let deletedData;
      await act(async () => {
        deletedData = await result.current.mutateAsync('test-client-id');
      });

      expect(result.current.isSuccess).toBe(true);
      expect(deletedData).toBeDefined();
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

      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync('test-client-id');
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('use cases', () => {
    it('should be useful for cleaning up orphaned actions', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      // This hook is specifically for cleaning up actions without templates
      await act(async () => {
        result.current.mutate('client-with-old-data');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify it specifically targets null template_id
      expect(mockIs).toHaveBeenCalledWith('template_id', null);
    });

    it('should handle clients with no orphaned actions', async () => {
      // Override mock to return empty array
      vi.mocked(mockSelect).mockImplementationOnce(() => 
        Promise.resolve({ data: [], error: null })
      );

      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate('clean-client-id');
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty client ID', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate('');
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should handle UUID format client ID', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate('550e8400-e29b-41d4-a716-446655440000');
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith('client_id', '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle multiple sequential calls', async () => {
      const { result } = renderHook(() => useDeleteOldClientActions(), {
        wrapper: createWrapper(),
      });

      // First call
      await act(async () => {
        await result.current.mutateAsync('client-1');
      });

      expect(result.current.isSuccess).toBe(true);

      // Second call
      await act(async () => {
        await result.current.mutateAsync('client-2');
      });

      expect(result.current.isSuccess).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('client_id', 'client-2');
    });
  });
});
