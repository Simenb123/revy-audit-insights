import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import PivotTable from 'react-pivottable';
import 'react-pivottable/pivottable.css';
import { usePivotData } from '@/hooks/usePivotData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface PivotWidgetProps {
  widget: Widget;
}

export function PivotWidget({ widget }: PivotWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = widget.config?.clientId as string | undefined;
  const rowField = widget.config?.rowField as string | undefined;
  const columnField = widget.config?.columnField as string | undefined;
  const valueField = widget.config?.valueField as string | undefined;

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
