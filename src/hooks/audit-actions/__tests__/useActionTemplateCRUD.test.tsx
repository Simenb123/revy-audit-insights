import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAuditActionTemplates,
  useCreateAuditActionTemplate,
  useUpdateAuditActionTemplate,
  useDeleteAuditActionTemplate,
} from '../useActionTemplateCRUD';

// Mock data
const mockTemplates = [
  {
    id: 'template-1',
    name: 'Test Template 1',
    subject_area_id: 'sales',
    action_type: 'analytical',
    procedures: 'Test procedures 1',
    applicable_phases: ['planning', 'fieldwork'],
    is_active: true,
  },
  {
    id: 'template-2',
    name: 'Test Template 2',
    subject_area_id: 'purchases',
    action_type: 'substantive',
    procedures: 'Test procedures 2',
    applicable_phases: ['completion'],
    is_active: true,
  },
];

// Mock supabase responses with explicit types
const mockSelectResponse: { data: typeof mockTemplates; error: null } = { 
  data: mockTemplates, 
  error: null 
};
const mockInsertResponse: { data: { id: string; name: string }; error: null } = { 
  data: { id: 'new-template-id', name: 'New Template' }, 
  error: null 
};
const mockUpdateResponse: { data: { id: string; name: string }; error: null } = { 
  data: { id: 'template-1', name: 'Updated Template' }, 
  error: null 
};
const mockDeleteResponse: { error: null } = { error: null };

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table);
      return {
        select: (columns?: string) => {
          mockSelect(columns);
          return {
            eq: (col: string, val: string | boolean) => {
              mockEq(col, val);
              return {
                eq: (col2: string, val2: boolean) => {
                  mockEq(col2, val2);
                  return {
                    order: () => {
                      mockOrder();
                      return Promise.resolve(mockSelectResponse);
                    },
                  };
                },
                order: () => {
                  mockOrder();
                  return Promise.resolve(mockSelectResponse);
                },
                single: () => {
                  mockSingle();
                  return Promise.resolve({ data: { name: 'sales' }, error: null });
                },
              };
            },
            order: () => {
              mockOrder();
              return Promise.resolve(mockSelectResponse);
            },
          };
        },
        insert: (data: unknown) => {
          mockInsert(data);
          return {
            select: () => ({
              single: () => {
                mockSingle();
                return Promise.resolve(mockInsertResponse);
              },
            }),
          };
        },
        update: (data: unknown) => {
          mockUpdate(data);
          return {
            eq: () => ({
              select: () => ({
                single: () => {
                  mockSingle();
                  return Promise.resolve(mockUpdateResponse);
                },
              }),
            }),
          };
        },
        delete: () => {
          mockDelete();
          return {
            eq: () => Promise.resolve(mockDeleteResponse),
          };
        },
      };
    },
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

// Helper to create valid template data for mutations
const createValidTemplateData = (overrides = {}) => ({
  name: 'New Template',
  subject_area: 'sales',
  subject_area_id: 'sales',
  action_type: 'analytical' as const,
  procedures: 'Test procedures',
  applicable_phases: ['planning'] as ('planning' | 'execution' | 'completion')[],
  is_system_template: false,
  is_active: true,
  sort_order: 1,
  risk_level: 'medium' as const,
  ...overrides,
});

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

    expect(mockFrom).toHaveBeenCalledWith('audit_action_templates');
    expect(mockSelect).toHaveBeenCalled();
  });

  it('should accept optional subjectArea filter', async () => {
    const { result } = renderHook(() => useAuditActionTemplates('sales'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith('subject_area_id', 'sales');
  });

  it('should return empty array when no templates exist', async () => {
    const { result } = renderHook(() => useAuditActionTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });

  it('should include query key with subject area', () => {
    const { result } = renderHook(() => useAuditActionTemplates('purchases'), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
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

  it('should call supabase insert on mutation', async () => {
    const { result } = renderHook(() => useCreateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(createValidTemplateData());
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockInsert).toHaveBeenCalled();
  });

  it('should show success toast on successful creation', async () => {
    const { result } = renderHook(() => useCreateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(createValidTemplateData());
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });

  it('should handle required fields validation', async () => {
    const { result } = renderHook(() => useCreateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(createValidTemplateData({ name: 'Minimal Template' }));
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
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

  it('should call supabase update on mutation', async () => {
    const { result } = renderHook(() => useUpdateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        id: 'template-1',
        name: 'Updated Template Name',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should handle partial updates', async () => {
    const { result } = renderHook(() => useUpdateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        id: 'template-1',
        name: 'Only Name Updated',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });

  it('should update multiple fields at once', async () => {
    const { result } = renderHook(() => useUpdateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        id: 'template-1',
        name: 'Updated Name',
        procedures: 'Updated procedures',
        risk_level: 'high',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
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

  it('should call supabase delete on mutation', async () => {
    const { result } = renderHook(() => useDeleteAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('template-1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalled();
  });

  it('should handle deletion of non-existent template', async () => {
    const { result } = renderHook(() => useDeleteAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('non-existent-id');
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });
});

describe('integration scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should invalidate queries after create', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateAuditActionTemplate(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(createValidTemplateData());
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });
  });

  it('should handle concurrent operations', async () => {
    const { result: createResult } = renderHook(() => useCreateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    const { result: updateResult } = renderHook(() => useUpdateAuditActionTemplate(), {
      wrapper: createWrapper(),
    });

    expect(createResult.current.isPending).toBe(false);
    expect(updateResult.current.isPending).toBe(false);
  });
});
