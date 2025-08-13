import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import PivotTable from 'react-pivottable';
import 'react-pivottable/pivottable.css';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface PivotWidgetProps {
  widget: Widget;
}

export function PivotWidget({ widget }: PivotWidgetProps) {
  const { updateWidget, clientId: contextClientId, year } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = (widget.config?.clientId as string | undefined) || contextClientId;
  const periodYear = widget.config?.period_year || selectedFiscalYear || year;
  const dataSource = widget.config?.dataSource || 'trial_balance';
  const rowField = widget.config?.rowField as string | undefined;
  const columnField = widget.config?.columnField as string | undefined;
  const valueField = widget.config?.valueField as string | undefined;

  const { data: tbData } = useTrialBalanceWithMappings(clientId || '', periodYear);
  const { data: txData } = useGeneralLedgerData(clientId || '');
  const { data: budgetData } = useBudgetAnalytics(clientId || '', periodYear);

  let entries: Record<string, any>[] = [];
  if (dataSource === 'transactions') {
    entries = (txData || []).map(t => ({
      ...t,
      amount: (t.debit_amount || 0) - (t.credit_amount || 0),
    }));
  } else if (dataSource === 'budget') {
    entries = (budgetData?.byUser || []).map(r => ({
      name: r.name,
      hours: r.hours,
    }));
  } else {
    entries = tbData?.trialBalanceEntries || [];
  }

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  const hasConfig = !!(rowField && columnField && valueField);

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
            vals={valueField ? [valueField] : []}
            aggregatorName="Sum"
            rendererName="Table"
          />
        )}
      </CardContent>
    </Card>
  );
}
