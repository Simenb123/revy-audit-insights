import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineEditableTitle } from '../InlineEditableTitle';
import PivotTable from 'react-pivottable';
import 'react-pivottable/pivottable.css';
import { usePivotData } from '@/hooks/usePivotData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useScope } from '@/contexts/ScopeContext';
import { exportArrayToXlsx } from '@/utils/exportToXlsx';

interface PivotWidgetProps {
  widget: Widget;
}

export function PivotWidget({ widget }: PivotWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const { scopeType, selectedClientIds } = useScope();
  const clientId = widget.config?.clientId as string | undefined;
  const dataSource = widget.config?.dataSource || 'trial_balance';
  const rowField = widget.config?.rowField as string | undefined;
  const columnField = widget.config?.columnField as string | undefined;
  const valueField = widget.config?.valueField as string | undefined;
  const { data } = useTrialBalanceWithMappings(clientId || '', selectedFiscalYear);
  const { data: txData } = useTransactions(clientId || '', { pageSize: 1000 });

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
      : data?.trialBalanceEntries || [];
  
  const { data: pivotEntries = [] } = usePivotData({
    clientId,
    fiscalYear: selectedFiscalYear,
    rowField,
    columnField,
    valueField,
    scopeType,
    selectedClientIds,
  });

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  const actualValueField = valueField || (dataSource === 'transactions' ? 'amount' : undefined);
  const hasConfig = !!(rowField && columnField && actualValueField);

  const currentData = scopeType === 'client' && (dataSource === 'transactions' || dataSource === 'trial_balance')
    ? entries
    : pivotEntries;

  const hasData = (currentData?.length || 0) > 0;

  const handleExport = () => {
    if (!hasData) return;
    exportArrayToXlsx(widget.title || 'Pivotdata', currentData);
  };

  const setColumnField = (field?: string) => {
    updateWidget(widget.id, { config: { ...widget.config, columnField: field } });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <InlineEditableTitle
          title={widget.title}
          onTitleChange={handleTitleChange}
          size="sm"
        />
        <div className="flex items-center gap-2">
          {scopeType === 'custom' && dataSource !== 'transactions' && (
            <div className="flex items-center gap-1">
              <Button
                variant={columnField === 'client_name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setColumnField(columnField === 'client_name' ? undefined : 'client_name')}
              >
                Kolonner: Klient
              </Button>
              <Button
                variant={columnField === 'client_group' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setColumnField(columnField === 'client_group' ? undefined : 'client_group')}
              >
                Kolonner: Konsern
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!hasData}>
            Eksporter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData || !hasConfig ? (
          <div className="text-sm text-muted-foreground">
            Ingen pivottabell-data.
          </div>
        ) : (
          <PivotTable
            data={currentData}
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
