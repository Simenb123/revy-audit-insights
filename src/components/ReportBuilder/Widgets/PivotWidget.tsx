import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import PivotTable from 'react-pivottable';
import 'react-pivottable/pivottable.css';
import { usePivotData } from '@/hooks/usePivotData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';

interface PivotWidgetProps {
  widget: Widget;
}

export function PivotWidget({ widget }: PivotWidgetProps) {
  const { updateWidget, clientId: contextClientId } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = (widget.config?.clientId as string | undefined) || contextClientId;
  const dataSource = widget.config?.dataSource || 'trial_balance';
  const rowField = widget.config?.rowField as string | undefined;
  const columnField = widget.config?.columnField as string | undefined;
  const valueField = widget.config?.valueField as string | undefined;
  const { data } = useTrialBalanceWithMappings(clientId || '', selectedFiscalYear);
  const { data: txData } = useTransactions(clientId || '', { pageSize: 1000 });
  const { data: budgetData } = useBudgetAnalytics(clientId, selectedFiscalYear);

  const entries: Record<string, any>[] =
    dataSource === 'transactions'
      ? (txData?.transactions || []).map(t => ({
          transaction_date: t.transaction_date,
          account_number: t.account_number,
          description: t.description,
          amount:
            t.balance_amount ??
            ((t.debit_amount || 0) as number - (t.credit_amount || 0) as number),
        }))
      : dataSource === 'budget'
      ? budgetData?.rows || []
      : data?.trialBalanceEntries || [];
  
  const { data: entries = [] } = usePivotData({
    clientId,
    fiscalYear: selectedFiscalYear,
    rowField,
    columnField,
    valueField,
  });

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  const actualValueField = valueField || (dataSource === 'transactions' ? 'amount' : undefined);
  const hasConfig = !!(rowField && columnField && actualValueField);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle
          title={widget.title}
          onTitleChange={handleTitleChange}
          size="sm"
        />
      </CardHeader>
      <CardContent>
        {!clientId || entries.length === 0 || !hasConfig ? (
          <div className="text-sm text-muted-foreground">
            Ingen pivottabell-data.
          </div>
        ) : (
          <PivotTable
            data={entries}
            rows={rowField ? [rowField] : []}
            cols={columnField ? [columnField] : []}
            vals={actualValueField ? [actualValueField] : []}
            aggregatorName="Sum"
            rendererName="Table"
          />
        )}
      </CardContent>
    </Card>
  );
}
