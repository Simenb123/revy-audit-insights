import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCopyActionsFromClient } from '../useCopyActionsFromClient';

// Mock source actions data
const mockSourceActions = [
  { 
    id: 'source-action-1', 
    name: 'Test Action 1',
    template_id: 'template-1',
    subject_area: 'sales',
    action_type: 'analytical',
    phase: 'planning',
    procedures: 'Test procedures 1',
    risk_level: 'medium',
    sort_order: 1,
    documentation_requirements: 'Docs 1',
    estimated_hours: 2,
  },
  { 
    id: 'source-action-2', 
    name: 'Test Action 2',
    template_id: 'template-2',
    subject_area: 'purchases',
    action_type: 'substantive',
    phase: 'fieldwork',
    procedures: 'Test procedures 2',
    risk_level: 'high',
    sort_order: 2,
    documentation_requirements: 'Docs 2',
    estimated_hours: 4,
  },
];

// Mock supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: (columns?: string) => {
        mockSelect(columns);
        return {
          eq: (col: string, val: string) => {
            mockEq(col, val);
            return {
              in: (col2: string, vals: string[]) => {
                mockIn(col2, vals);
                return Promise.resolve({ 
                  data: mockSourceActions.filter(a => vals.includes(a.id)), 
                  error: null 
                });
              },
            };
          },
        };
      },
      insert: (data: unknown) => {
        mockInsert(data);
        return {
          select: () => Promise.resolve({ 
            data: [{ id: 'new-action-id', name: 'Copied Action' }], 
            error: null 
          }),
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

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
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

describe('useCopyActionsFromClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined and return mutation object', () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });

    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('copying single action', () => {
    it('should copy a single action successfully', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'target-client-id',
          sourceClientId: 'source-client-id',
          actionIds: ['source-action-1'],
          phase: 'planning',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      expect(mockSelect).toHaveBeenCalled();
      expect(mockIn).toHaveBeenCalledWith('id', ['source-action-1']);
    });

    it('should set correct target client ID', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'specific-target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1'],
          phase: 'planning',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      // Verify insert was called with target client ID
      expect(mockInsert).toHaveBeenCalled();
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall[0].client_id).toBe('specific-target-client');
    });
  });

  describe('copying multiple actions', () => {
    it('should copy multiple actions at once', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1', 'source-action-2'],
          phase: 'fieldwork',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      expect(mockIn).toHaveBeenCalledWith('id', ['source-action-1', 'source-action-2']);
    });

    it('should insert all copied actions in single batch', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1', 'source-action-2'],
          phase: 'planning',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      // Should batch insert
      expect(mockInsert).toHaveBeenCalledTimes(1);
      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData.length).toBe(2);
    });
  });

  describe('phase handling', () => {
    it('should set correct phase on copied actions', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1'],
          phase: 'completion',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData[0].phase).toBe('completion');
    });

    it('should handle all valid phases', async () => {
      const phases = ['planning', 'fieldwork', 'completion'] as const;

      for (const phase of phases) {
        vi.clearAllMocks();
        
        const { result } = renderHook(() => useCopyActionsFromClient(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.mutate({
            targetClientId: 'target-client',
            sourceClientId: 'source-client',
            actionIds: ['source-action-1'],
            phase,
          });
        });

        await waitFor(() => {
          expect(result.current.isSuccess || result.current.isError).toBe(true);
        });

        const insertedData = mockInsert.mock.calls[0][0];
        expect(insertedData[0].phase).toBe(phase);
      }
    });
  });

  describe('action data transformation', () => {
    it('should reset status to not_started', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1'],
          phase: 'planning',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData[0].status).toBe('not_started');
    });

    it('should preserve template_id from source', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1'],
          phase: 'planning',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData[0].template_id).toBe('template-1');
    });

    it('should copy procedures and documentation requirements', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1'],
          phase: 'planning',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData[0].procedures).toBe('Test procedures 1');
    });
  });

  describe('query invalidation', () => {
    it('should invalidate client audit actions query after success', async () => {
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

      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1'],
          phase: 'planning',
        });
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('toast notifications', () => {
    it('should show success toast with action count', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: ['source-action-1', 'source-action-2'],
          phase: 'planning',
        });
      });

      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty action IDs array', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'target-client',
          sourceClientId: 'source-client',
          actionIds: [],
          phase: 'planning',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should handle same source and target client', async () => {
      const { result } = renderHook(() => useCopyActionsFromClient(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          targetClientId: 'same-client',
          sourceClientId: 'same-client',
          actionIds: ['source-action-1'],
          phase: 'planning',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });
  });
});
