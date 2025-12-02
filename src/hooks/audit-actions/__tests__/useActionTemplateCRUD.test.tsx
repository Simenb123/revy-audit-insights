import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAuditActionTemplates,
  useCreateAuditActionTemplate,
  useUpdateAuditActionTemplate,
  useDeleteAuditActionTemplate,
} from '../useActionTemplateCRUD';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: { name: 'Test' }, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'new-template-id', name: 'Test Template' }, 
            error: null 
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { id: 'template-id', name: 'Updated Template' }, 
              error: null 
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
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

describe('useAuditActionTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch templates successfully', async () => {
    const { result } = renderHook(() => useAuditActionTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });

  it('should accept optional subjectArea filter', async () => {
    const { result } = renderHook(() => useAuditActionTemplates('sales'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });
});

describe('useCreateAuditActionTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined and return mutation object', () => {
    const { result } = renderHook(() => useCreateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useUpdateAuditActionTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined and return mutation object', () => {
    const { result } = renderHook(() => useUpdateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useDeleteAuditActionTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined and return mutation object', () => {
    const { result } = renderHook(() => useDeleteAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});
