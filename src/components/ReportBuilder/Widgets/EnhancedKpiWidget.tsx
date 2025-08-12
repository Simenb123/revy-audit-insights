import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { formatCurrency } from '@/lib/formatters';

interface EnhancedKpiWidgetProps {
  widget: Widget;
}

export function EnhancedKpiWidget({ widget }: EnhancedKpiWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId;
  const sourceType = widget.config?.sourceType || 'alias';
  const metric = widget.config?.metric || 'revenue';
  const formulaId = sourceType === 'formula' ? widget.config?.formulaId : undefined;
  const customFormula = sourceType === 'expr' ? (widget.config?.customFormula ?? '') : metric;
  const showTrend = widget.config?.showTrend !== false;
  const displayAsPercentage = widget.config?.displayAsPercentage || false;
  const showCurrency = widget.config?.showCurrency !== false;
  const unitScale = widget.config?.unitScale || 'none';
  const threshold = widget.config?.threshold ?? 0;
  const positiveColor = widget.config?.positiveColor || 'text-success';
  const negativeColor = widget.config?.negativeColor || 'text-destructive';

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  const currentFormulaResult = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    formulaId,
    customFormula,
    selectedVersion: widget.config?.selectedVersion,
    enabled: !!clientId && !!selectedFiscalYear
  });

  const previousFiscalYear = selectedFiscalYear - 1;
  const previousFormulaResult = useFormulaCalculation({
    clientId,
    fiscalYear: previousFiscalYear,
    formulaId,
    customFormula,
    selectedVersion: widget.config?.selectedVersion,
    enabled: !!clientId && !!previousFiscalYear && showTrend
  });

  const metricData = React.useMemo(() => {
    if (currentFormulaResult.isLoading) {
      return { value: 'Laster...', change: '0%', trend: 'neutral' as const, raw: 0 };
    }

    if (currentFormulaResult.error || !currentFormulaResult.data?.isValid) {
      return { value: 'N/A', change: '0%', trend: 'neutral' as const, raw: 0 };
    }

    const currentValue = currentFormulaResult.data.value;
    const resultType = currentFormulaResult.data.metadata?.type as 'amount' | 'percentage' | 'ratio' | undefined;

    const scaleDivisor =
      resultType === 'amount'
        ? (unitScale === 'thousand' ? 1000 : unitScale === 'million' ? 1_000_000 : 1)
        : 1;

    const scaledCurrent = currentValue / scaleDivisor;

    const formattedValue =
      (displayAsPercentage || resultType === 'percentage')
        ? `${scaledCurrent.toFixed(1)}%`
        : resultType === 'ratio'
          ? new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaledCurrent)
          : showCurrency
            ? formatCurrency(scaledCurrent)
            : new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaledCurrent);

    if (!showTrend || previousFormulaResult.isLoading || previousFormulaResult.error || !previousFormulaResult.data?.isValid) {
      return { value: formattedValue, change: '0%', trend: 'neutral' as const, raw: scaledCurrent };
    }

    const previousValue = previousFormulaResult.data.value;
    if (previousValue === 0) {
      return { value: formattedValue, change: '0%', trend: 'neutral' as const, raw: scaledCurrent };
    }

    const diff = currentValue - previousValue;
    const changePercent = (diff / Math.abs(previousValue)) * 100;
    const trend =
      changePercent > 0
        ? ('up' as const)
        : changePercent < 0
        ? ('down' as const)
        : ('neutral' as const);
    const formattedChange =
      (changePercent > 0 ? '+' : '') + changePercent.toFixed(1) + '%';

    return {
      value: formattedValue,
      change: formattedChange,
      trend,
      raw: scaledCurrent,
    };
  }, [currentFormulaResult, previousFormulaResult, showTrend, displayAsPercentage, showCurrency, unitScale]);

  if (currentFormulaResult.isLoading) {
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
          <div className="text-2xl font-bold">Laster...</div>
        </CardContent>
      </Card>
    );
  }

  const valueColor = metricData.raw > threshold
    ? positiveColor
    : metricData.raw < threshold
      ? negativeColor
      : '';

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
        <div className={`text-2xl font-bold ${valueColor}`}>{metricData.value}</div>
        {showTrend && (
          <div className="flex items-center pt-1">
            {metricData.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-success mr-1" />
            ) : metricData.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-destructive mr-1" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground mr-1" />
            )}
            <span
              className={`text-xs ${
                metricData.trend === 'up'
                  ? 'text-success'
                  : metricData.trend === 'down'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {metricData.change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

