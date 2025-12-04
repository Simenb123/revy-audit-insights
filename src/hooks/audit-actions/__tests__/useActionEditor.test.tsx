import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useActionEditor } from '../useActionEditor';
import type { ClientAuditAction } from '@/types/audit-actions';

// Mock useUpdateClientAuditAction
const mockMutateAsync = vi.fn().mockResolvedValue({});
vi.mock('@/hooks/useAuditActions', () => ({
  useUpdateClientAuditAction: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
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
  { id: 'field3', label: 'Field 3', type: 'number' as const, required: true },
];

describe('useActionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('initialization', () => {
    it('should initialize with action status', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      expect(result.current.status).toBe('not_started');
      expect(result.current.hasChanges).toBe(false);
      expect(result.current.responseFieldValues).toEqual({});
    });

    it('should initialize with existing response data', () => {
      const actionWithData: ClientAuditAction = {
        ...mockAction,
        working_paper_data: {
          response_data: {
            field1: 'existing value',
            field3: 42,
          },
        },
      };

      const { result } = renderHook(
        () => useActionEditor(actionWithData, mockResponseFields),
        { wrapper: createWrapper() }
      );

      expect(result.current.responseFieldValues.field1).toBe('existing value');
      expect(result.current.responseFieldValues.field3).toBe(42);
    });

    it('should handle missing response fields gracefully', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.responseFieldValues).toEqual({});
      expect(result.current.getCompletionPercentage()).toBe(100);
    });
  });

  describe('status changes', () => {
    it('should handle status change to in_progress', () => {
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

    it('should prevent completion without required fields', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleStatusChange('completed');
      });

      // Status should not change to completed if validation fails
      expect(result.current.status).toBe('not_started');
      expect(result.current.responseFieldErrors).toBeDefined();
    });

    it('should allow completion when all required fields are filled', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      // Fill all required fields
      act(() => {
        result.current.handleResponseFieldChange('field1', 'value');
        result.current.handleResponseFieldChange('field3', 123);
      });

      act(() => {
        result.current.handleStatusChange('completed');
      });

      expect(result.current.status).toBe('completed');
    });
  });

  describe('response field handling', () => {
    it('should handle text field change', () => {
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

    it('should handle number field change', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleResponseFieldChange('field3', 42);
      });

      expect(result.current.responseFieldValues.field3).toBe(42);
    });

    it('should handle boolean field change', () => {
      const fieldsWithBoolean = [
        ...mockResponseFields,
        { id: 'boolField', label: 'Boolean', type: 'boolean' as const, required: false },
      ];

      const { result } = renderHook(
        () => useActionEditor(mockAction, fieldsWithBoolean),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleResponseFieldChange('boolField', true);
      });

      expect(result.current.responseFieldValues.boolField).toBe(true);
    });

    it('should handle array field change', () => {
      const fieldsWithArray = [
        ...mockResponseFields,
        { id: 'arrayField', label: 'Array', type: 'multiselect' as const, required: false },
      ];

      const { result } = renderHook(
        () => useActionEditor(mockAction, fieldsWithArray),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleResponseFieldChange('arrayField', ['option1', 'option2']);
      });

      expect(result.current.responseFieldValues.arrayField).toEqual(['option1', 'option2']);
    });

    it('should clear field errors when field is updated', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      // Trigger validation errors
      act(() => {
        result.current.handleStatusChange('completed');
      });

      expect(result.current.responseFieldErrors.field1).toBeDefined();

      // Update the field
      act(() => {
        result.current.handleResponseFieldChange('field1', 'new value');
      });

      // Error should be cleared
      expect(result.current.responseFieldErrors.field1).toBeUndefined();
    });
  });

  describe('completion percentage', () => {
    it('should return 0% when no required fields are filled', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      expect(result.current.getCompletionPercentage()).toBe(0);
    });

    it('should return 50% when half of required fields are filled', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleResponseFieldChange('field1', 'value');
      });

      // 1 of 2 required fields filled
      expect(result.current.getCompletionPercentage()).toBe(50);
    });

    it('should return 100% when all required fields are filled', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleResponseFieldChange('field1', 'value');
        result.current.handleResponseFieldChange('field3', 123);
      });

      expect(result.current.getCompletionPercentage()).toBe(100);
    });

    it('should ignore optional fields in calculation', () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      // Fill only optional field
      act(() => {
        result.current.handleResponseFieldChange('field2', 'optional value');
      });

      expect(result.current.getCompletionPercentage()).toBe(0);
    });

    it('should return 100% when no required fields exist', () => {
      const optionalOnlyFields = [
        { id: 'opt1', label: 'Optional 1', type: 'text' as const, required: false },
        { id: 'opt2', label: 'Optional 2', type: 'text' as const, required: false },
      ];

      const { result } = renderHook(
        () => useActionEditor(mockAction, optionalOnlyFields),
        { wrapper: createWrapper() }
      );

      expect(result.current.getCompletionPercentage()).toBe(100);
    });
  });

  describe('save functionality', () => {
    it('should save changes successfully', async () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleStatusChange('in_progress');
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockMutateAsync).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('should show error toast on save failure', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleStatusChange('in_progress');
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('should not save if no changes', async () => {
      const { result } = renderHook(
        () => useActionEditor(mockAction, mockResponseFields),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('synchronization', () => {
    it('should sync with action changes from server', () => {
      const { result, rerender } = renderHook(
        ({ action }) => useActionEditor(action, mockResponseFields),
        { 
          wrapper: createWrapper(),
          initialProps: { action: mockAction }
        }
      );

      expect(result.current.status).toBe('not_started');

      const updatedAction = { ...mockAction, status: 'in_progress' as const };
      rerender({ action: updatedAction });

      expect(result.current.status).toBe('in_progress');
      expect(result.current.hasChanges).toBe(false);
    });

    it('should preserve local changes when action ID remains same', () => {
      const { result, rerender } = renderHook(
        ({ action }) => useActionEditor(action, mockResponseFields),
        { 
          wrapper: createWrapper(),
          initialProps: { action: mockAction }
        }
      );

      // Make local change
      act(() => {
        result.current.handleResponseFieldChange('field1', 'local value');
      });

      expect(result.current.hasChanges).toBe(true);

      // Rerender with same action
      rerender({ action: mockAction });

      // Local changes should be preserved
      expect(result.current.responseFieldValues.field1).toBe('local value');
    });

    it('should reset state when action ID changes', () => {
      const { result, rerender } = renderHook(
        ({ action }) => useActionEditor(action, mockResponseFields),
        { 
          wrapper: createWrapper(),
          initialProps: { action: mockAction }
        }
      );

      act(() => {
        result.current.handleResponseFieldChange('field1', 'local value');
      });

      const differentAction = { ...mockAction, id: 'action-2' };
      rerender({ action: differentAction });

      // State should reset for new action
      expect(result.current.responseFieldValues.field1).toBeUndefined();
      expect(result.current.hasChanges).toBe(false);
    });
  });
});
