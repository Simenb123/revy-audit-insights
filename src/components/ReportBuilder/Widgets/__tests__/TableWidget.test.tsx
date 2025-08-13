import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TableWidget } from '../TableWidget';
import { WidgetManagerProvider } from '@/contexts/WidgetManagerContext';

vi.mock('@/hooks/useTrialBalanceWithMappings', () => ({
  useTrialBalanceWithMappings: () => ({
    data: {
      trialBalanceEntries: [
        {
          id: '1',
          account_number: '3000',
          account_name: 'Sales',
          closing_balance: 1000,
          standard_name: 'RevenueCategory',
          standard_account_type: 'REVENUE',
          standard_category: 'REVENUE_CATEGORY',
          is_mapped: true
        },
        {
          id: '2',
          account_number: '5000',
          account_name: 'Rent',
          closing_balance: -500,
          standard_name: 'ExpenseCategory',
          standard_account_type: 'EXPENSE',
          standard_category: 'EXPENSE_CATEGORY',
          is_mapped: true
        },
        {
          id: '3',
          account_number: '1000',
          account_name: 'Cash',
          closing_balance: 200,
          standard_name: 'CurrentAssetCategory',
          standard_account_type: 'ASSET',
          standard_category: 'CURRENT_ASSET',
          is_mapped: true
        }
      ]
    },
    isLoading: false
  })
}));

vi.mock('@/contexts/FiscalYearContext', () => ({
  useFiscalYear: () => ({ selectedFiscalYear: 2024 })
}));

describe('TableWidget', () => {
  const baseWidget = {
    id: 'widget-1',
    type: 'table' as const,
    title: 'Test Table',
    config: {
      clientId: '123',
      groupByCategory: true
    }
  };

  it('filters accounts by standard account type when filterByClassification is set', () => {
    const widget = {
      ...baseWidget,
      config: {
        ...baseWidget.config,
        filterByClassification: 'REVENUE'
      }
    };

    render(
      <WidgetManagerProvider clientId="123" year={2024}>
        <TableWidget widget={widget} />
      </WidgetManagerProvider>
    );

    expect(screen.getByText('RevenueCategory')).toBeInTheDocument();
    expect(screen.queryByText('ExpenseCategory')).not.toBeInTheDocument();
  });

  it('filters accounts by category when filterByClassification matches standard_category', () => {
    const widget = {
      ...baseWidget,
      config: {
        ...baseWidget.config,
        filterByClassification: 'CURRENT_ASSET'
      }
    };

    render(
      <WidgetManagerProvider clientId="123" year={2024}>
        <TableWidget widget={widget} />
      </WidgetManagerProvider>
    );

    expect(screen.getByText('CurrentAssetCategory')).toBeInTheDocument();
    expect(screen.queryByText('RevenueCategory')).not.toBeInTheDocument();
    expect(screen.queryByText('ExpenseCategory')).not.toBeInTheDocument();
  });
});

