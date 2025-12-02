import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useActionEditor } from '../useActionEditor';
import type { ClientAuditAction } from '@/types/audit-actions';

// Mock useUpdateClientAuditAction
vi.mock('@/hooks/useAuditActions', () => ({
  useUpdateClientAuditAction: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
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

const mockAction: ClientAuditAction = {
  id: 'action-1',
  client_id: 'client-1',
  subject_area: 'sales',
  action_type: 'analytical',
  status: 'not_started',
  phase: 'planning',
  sort_order: 1,
  name: 'Test Action',
  procedures: 'Test procedures',
  risk_level: 'medium',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockResponseFields = [
  { id: 'field1', label: 'Field 1', type: 'text' as const, required: true },
  { id: 'field2', label: 'Field 2', type: 'text' as const, required: false },
];

describe('useActionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with action status', () => {
    const { result } = renderHook(
      () => useActionEditor(mockAction, mockResponseFields),
      { wrapper: createWrapper() }
    );

    expect(result.current.status).toBe('not_started');
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.responseFieldValues).toEqual({});
  });

  it('should handle status change', () => {
    const { result } = renderHook(
      () => useActionEditor(mockAction, mockResponseFields),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleStatusChange('in_progress');
    });

    expect(result.current.status).toBe('in_progress');
    expect(result.current.hasChanges).toBe(true);
  });

  it('should handle response field change', () => {
    const { result } = renderHook(
      () => useActionEditor(mockAction, mockResponseFields),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleResponseFieldChange('field1', 'test value');
    });

    expect(result.current.responseFieldValues.field1).toBe('test value');
    expect(result.current.hasChanges).toBe(true);
  });

  it('should calculate completion percentage', () => {
    const { result } = renderHook(
      () => useActionEditor(mockAction, mockResponseFields),
      { wrapper: createWrapper() }
    );

    // No fields filled - 0%
    expect(result.current.getCompletionPercentage()).toBe(0);

    // Fill required field
    act(() => {
      result.current.handleResponseFieldChange('field1', 'test value');
    });

    // Required field filled - 100%
    expect(result.current.getCompletionPercentage()).toBe(100);
  });

  it('should validate before completing', () => {
    const { result } = renderHook(
      () => useActionEditor(mockAction, mockResponseFields),
      { wrapper: createWrapper() }
    );

    // Try to complete without filling required fields
    act(() => {
      result.current.handleStatusChange('completed');
    });

    // Status should not change to completed if validation fails
    expect(result.current.status).toBe('not_started');
  });

  it('should sync with action changes', () => {
    const { result, rerender } = renderHook(
      ({ action }) => useActionEditor(action, mockResponseFields),
      { 
        wrapper: createWrapper(),
        initialProps: { action: mockAction }
      }
    );

    expect(result.current.status).toBe('not_started');

    // Simulate action update from server
    const updatedAction = { ...mockAction, status: 'in_progress' as const };
    rerender({ action: updatedAction });

    expect(result.current.status).toBe('in_progress');
    expect(result.current.hasChanges).toBe(false);
  });
});
