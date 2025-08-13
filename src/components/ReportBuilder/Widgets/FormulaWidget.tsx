import React, { useEffect, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFilters } from '@/contexts/FilterContext';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { formatCurrency } from '@/lib/formatters';

interface FormulaWidgetProps {
  /**
   * Widget configuration. The formula expression should be provided via
   * `widget.config.formula` and the client via `widget.config.clientId`.
   */
  widget: Widget;
  /** Optional format of the result. Defaults to plain number. */
  format?: 'currency' | 'percent' | 'number';
}

/**
 * Displays the result of a formula expression. The component re-calculates the
 * value whenever filters, client, fiscal year or the formula itself changes.
 * It reuses the same formula engine that is utilised in AccountLinesWidget.
 */
export function FormulaWidget({ widget, format: formatProp }: FormulaWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const { filters } = useFilters();

  const clientId = widget.config?.clientId;
  const formula = widget.config?.formula;
  const selectedVersion = widget.config?.selectedVersion;

  const format = (formatProp || widget.config?.format || 'number') as
    | 'currency'
    | 'percent'
    | 'number';

  const handleTitleChange = (title: string) => {
    updateWidget(widget.id, { title });
  };

  const calculation = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    customFormula: formula,
    selectedVersion,
    enabled: !!clientId && !!selectedFiscalYear && !!formula,
  });

  // Recalculate whenever filters change
  useEffect(() => {
    calculation.refetch();
  }, [filters, calculation.refetch]);

  const displayValue = useMemo(() => {
    if (calculation.isLoading) return 'Laster...';
    if (calculation.error || !calculation.data?.isValid) return 'N/A';

    const value = calculation.data.value;
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return value.toFixed(1) + '%';
      default:
        return new Intl.NumberFormat('nb-NO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value);
    }
  }, [calculation, format]);

  if (!clientId || !formula) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-destructive">
            <Calculator className="h-4 w-4" />
            <InlineEditableTitle
              title={widget.title}
              onTitleChange={handleTitleChange}
              size="sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {!clientId ? 'Klient ikke valgt' : 'Ingen formel konfigurert'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          <InlineEditableTitle
            title={widget.title}
            onTitleChange={handleTitleChange}
            size="sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        {calculation.data?.error && (
          <div className="mt-2 text-xs text-destructive">
            {calculation.data.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

