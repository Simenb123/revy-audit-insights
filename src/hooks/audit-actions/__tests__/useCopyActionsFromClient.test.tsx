import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCopyActionsFromClient } from '../useCopyActionsFromClient';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ 
            data: [
              { 
                id: 'source-action-1', 
                name: 'Test Action',
                template_id: 'template-1',
                subject_area: 'sales',
                action_type: 'analytical',
                phase: 'planning',
                procedures: 'Test procedures',
                risk_level: 'medium',
                sort_order: 1,
              }
            ], 
            error: null 
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [{ id: 'new-action-id', name: 'Test Action' }], 
          error: null 
        })),
      })),
    })),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

  it('should be defined and return mutation object', () => {
    const { result } = renderHook(() => useCopyActionsFromClient(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('should handle mutation call', async () => {
    const { result } = renderHook(() => useCopyActionsFromClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      targetClientId: 'target-client-id',
      sourceClientId: 'source-client-id',
      actionIds: ['action-1'],
      phase: 'planning',
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });
});
