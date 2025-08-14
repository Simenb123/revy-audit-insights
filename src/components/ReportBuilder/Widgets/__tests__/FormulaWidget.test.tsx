import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormulaWidget } from '../FormulaWidget';
import { WidgetManagerProvider } from '@/contexts/WidgetManagerContext';

const refetch = vi.fn();

vi.mock('@/hooks/useFormulaCalculation', () => ({
  useFormulaCalculation: () => ({
    data: { value: 100, isValid: true },
    isLoading: false,
    error: null as any,
    refetch,
  }),
}));

vi.mock('@/hooks/useFormulas', () => ({
  useFormulaDefinitions: () => ({
    data: [] as any[],
    isLoading: false,
    error: null as any,
  }),
}));

vi.mock('@/contexts/FiscalYearContext', () => ({
  useFiscalYear: () => ({ selectedFiscalYear: 2024 }),
}));

let filters: Record<string, any> = {};
vi.mock('@/contexts/FilterContext', () => ({
  useFilters: () => ({ filters }),
}));

describe('FormulaWidget', () => {
  const widget = {
    id: 'w1',
    type: 'formula' as const,
    title: 'Result',
    config: { clientId: 'c1', formula: '[10]' },
  };

  it('formats value as currency', () => {
    render(
      <WidgetManagerProvider clientId="c1" year={2024}>
        <FormulaWidget widget={widget} format="currency" />
      </WidgetManagerProvider>
    );

    expect(screen.getByText(/kr/)).toBeInTheDocument();
  });

  it('refetches when filters change', async () => {
    const { rerender } = render(
      <WidgetManagerProvider clientId="c1" year={2024}>
        <FormulaWidget widget={widget} />
      </WidgetManagerProvider>
    );

    filters = { accountCategory: 'asset' };
    rerender(
      <WidgetManagerProvider clientId="c1" year={2024}>
        <FormulaWidget widget={widget} />
      </WidgetManagerProvider>
    );

    await waitFor(() => {
      expect(refetch).toHaveBeenCalled();
    });
  });
});

