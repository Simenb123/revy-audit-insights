import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';

interface BudgetKpiWidgetProps {
  widget: Widget;
}

export function BudgetKpiWidget({ widget }: BudgetKpiWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = widget.config?.clientId as string | undefined;
  const year = (widget.config?.period_year as number | undefined) ?? selectedFiscalYear;

  const { data, isLoading } = useBudgetAnalytics(clientId, year);

  const handleTitleChange = (newTitle: string) => updateWidget(widget.id, { title: newTitle });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Laster budsjett...</div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Totalt budsjett {year}</div>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('nb-NO').format(data?.totalHours ?? 0)} t</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
