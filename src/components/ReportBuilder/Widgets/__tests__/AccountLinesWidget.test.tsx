import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccountLinesWidget } from '../AccountLinesWidget';
import { WidgetManagerProvider } from '@/contexts/WidgetManagerContext';

const toast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

vi.mock('@/hooks/useFirmStandardAccounts', () => ({
  useFirmStandardAccounts: () => ({
    data: [
      {
        standard_number: '10',
        standard_name: 'Sales',
      },
    ],
  }),
}));

vi.mock('@/contexts/FiscalYearContext', () => ({
  useFiscalYear: () => ({ selectedFiscalYear: 2024 }),
}));

const formulaValues: Record<string, number> = {
  '[10]': 1000,
  '[19-79]': 3000,
  '[20-29]': 250,
  '[30-39]': 0,
};

vi.mock('@/hooks/useFormulaCalculation', () => ({
  useFormulaCalculation: ({ customFormula }: any) => ({
    data: { value: formulaValues[customFormula as string] ?? 0, isValid: true },
    isLoading: false,
    error: null as any,
  }),
}));

describe('AccountLinesWidget', () => {
  const baseWidget = {
    id: 'widget-1',
    type: 'accountLines' as const,
    title: 'Test Account Lines',
    config: {
      clientId: '123',
      showCurrency: false,
      showYoY: false,
    },
  };

  it('renders account lines and intervals with correct values', () => {
    const widget = {
      ...baseWidget,
      config: {
        ...baseWidget.config,
        accountLines: ['10'],
        accountIntervals: ['19-79'],
      },
    };

    render(
      <WidgetManagerProvider clientId="123" year={2024}>
        <AccountLinesWidget widget={widget} />
      </WidgetManagerProvider>
    );

    expect(screen.getByText('10 - Sales')).toBeInTheDocument();
    expect(screen.getByText('1 000')).toBeInTheDocument();
    expect(screen.getByText('[19-79]')).toBeInTheDocument();
    expect(screen.getByText('3 000')).toBeInTheDocument();
  });

  it('calculates share of base expression', () => {
    const widget = {
      ...baseWidget,
      config: {
        ...baseWidget.config,
        accountLines: ['10'],
        accountIntervals: ['20-29'],
        showShareOf: true,
        shareBaseExpr: '[10]',
      },
    };

    render(
      <WidgetManagerProvider clientId="123" year={2024}>
        <AccountLinesWidget widget={widget} />
      </WidgetManagerProvider>
    );

    expect(screen.getByText('1 000')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    expect(screen.getByText('[20-29]')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
  });

  it('warns when interval has no data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const widget = {
      ...baseWidget,
      config: {
        ...baseWidget.config,
        accountIntervals: ['30-39'],
      },
    };

    render(
      <WidgetManagerProvider clientId="123" year={2024}>
        <AccountLinesWidget widget={widget} />
      </WidgetManagerProvider>
    );

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(toast).toHaveBeenCalled();

    warn.mockRestore();
  });
});

