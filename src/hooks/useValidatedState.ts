import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { logger } from '@/utils/logger';

interface UseValidatedStateOptions<T> {
  schema: z.ZodSchema<T>;
  initialValue: T;
  onValidationError?: (error: string) => void;
  validateOnSet?: boolean;
}

interface ValidatedStateReturn<T> {
  value: T;
  setValue: (newValue: T) => boolean;
  setValueUnsafe: (newValue: T) => void;
  isValid: boolean;
  error: string | null;
  validate: () => boolean;
  reset: () => void;
}

export function useValidatedState<T>({
  schema,
  initialValue,
  onValidationError,
  validateOnSet = true,
}: UseValidatedStateOptions<T>): ValidatedStateReturn<T> {
  const [value, setValueInternal] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((valueToValidate: T = value): boolean => {
    try {
      schema.parse(valueToValidate);
      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof z.ZodError 
        ? err.errors.map(e => e.message).join(', ')
        : 'Validation failed';
      
      setError(errorMessage);
      onValidationError?.(errorMessage);
      logger.warn('Validation failed:', errorMessage);
      return false;
    }
  }, [schema, value, onValidationError]);

  const setValue = useCallback((newValue: T): boolean => {
    if (validateOnSet) {
      const isValid = validate(newValue);
      if (isValid) {
        setValueInternal(newValue);
        setError(null);
      }
      return isValid;
    } else {
      setValueInternal(newValue);
      return true;
    }
  }, [validate, validateOnSet]);

  const setValueUnsafe = useCallback((newValue: T) => {
    setValueInternal(newValue);
  }, []);

  const reset = useCallback(() => {
    setValueInternal(initialValue);
    setError(null);
  }, [initialValue]);

  const isValid = useMemo(() => {
    try {
      schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }, [schema, value]);

  return {
    value,
    setValue,
    setValueUnsafe,
    isValid,
    error,
    validate: () => validate(),
    reset,
  };
}

// Specialized hooks for common widget types
export function useValidatedWidget(initialWidget: any) {
  const { WidgetSchema } = require('@/types/widget');
  return useValidatedState({
    schema: WidgetSchema,
    initialValue: initialWidget,
    validateOnSet: true,
  });
}

export function useValidatedDashboard(initialDashboard: any) {
  const { DashboardConfigSchema } = require('@/types/widget');
  return useValidatedState({
    schema: DashboardConfigSchema,
    initialValue: initialDashboard,
    validateOnSet: true,
  });
}

export function useValidatedLayout(initialLayout: any[]) {
  const { WidgetLayoutSchema } = require('@/types/widget');
  return useValidatedState({
    schema: z.array(WidgetLayoutSchema),
    initialValue: initialLayout,
    validateOnSet: true,
  });
}