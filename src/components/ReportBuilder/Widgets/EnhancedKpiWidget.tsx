import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { formatCurrency } from '@/lib/formatters';
import { useScope } from '@/contexts/ScopeContext';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  const { scopeType, selectedClientIds } = useScope();
  const isGlobalMulti = !clientId && scopeType === 'custom' && (selectedClientIds?.length || 0) > 0;

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

  // Multi-client aggregation (global custom scope)
  const multiCurrent = useQueries({
    queries:
      isGlobalMulti
        ? (selectedClientIds || []).map((id) => ({
            queryKey: ['formula-calculation', id, selectedFiscalYear, formulaId ?? 'alias', customFormula, widget.config?.selectedVersion],
            queryFn: async () => {
              const payload: any = { clientId: id, fiscalYear: selectedFiscalYear, selectedVersion: widget.config?.selectedVersion };
              if (typeof formulaId === 'string') payload.formulaId = formulaId;
              if (customFormula !== undefined) payload.customFormula = customFormula;
              const { data, error } = await supabase.functions.invoke('calculate-formula', { body: payload });
              if (error) throw new Error(error.message || 'Formula calculation failed');
              return data as any;
            },
            staleTime: 5 * 60 * 1000,
          }))
        : [],
  });

  const multiPrev = useQueries({
    queries:
      isGlobalMulti && showTrend
        ? (selectedClientIds || []).map((id) => ({
            queryKey: ['formula-calculation-prev', id, previousFiscalYear, formulaId ?? 'alias', customFormula, widget.config?.selectedVersion],
            queryFn: async () => {
              const payload: any = { clientId: id, fiscalYear: previousFiscalYear, selectedVersion: widget.config?.selectedVersion };
              if (typeof formulaId === 'string') payload.formulaId = formulaId;
              if (customFormula !== undefined) payload.customFormula = customFormula;
              const { data, error } = await supabase.functions.invoke('calculate-formula', { body: payload });
              if (error) throw new Error(error.message || 'Formula calculation failed');
              return data as any;
            },
            staleTime: 5 * 60 * 1000,
          }))
        : [],
  });

  const metricData = React.useMemo(() => {
    if (isGlobalMulti) {
      if (multiCurrent.length === 0 || multiCurrent.some((q) => q.isLoading)) {
        return { value: 'Laster...', change: '0%', trend: 'neutral' as const, raw: 0 };
      }
      const valids = multiCurrent.map((q) => q.data).filter((d: any) => d && d.isValid);
      if (valids.length === 0) {
        return { value: 'N/A', change: '0%', trend: 'neutral' as const, raw: 0 };
      }
      const currentSum = valids.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
      const resultType = (valids.find((d: any) => d?.metadata?.type)?.metadata?.type || 'amount') as 'amount' | 'percentage' | 'ratio';
      const scaleDivisor = resultType === 'amount' ? (unitScale === 'thousand' ? 1000 : unitScale === 'million' ? 1_000_000 : 1) : 1;
      const scaledCurrent = currentSum / scaleDivisor;
      const formattedValue = (displayAsPercentage || resultType === 'percentage')
        ? `${scaledCurrent.toFixed(1)}%`
        : resultType === 'ratio'
          ? new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaledCurrent)
          : showCurrency
            ? formatCurrency(scaledCurrent)
            : new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaledCurrent);

      if (!showTrend) {
        return { value: formattedValue, change: '0%', trend: 'neutral' as const, raw: scaledCurrent };
      }
      if (multiPrev.length === 0 || multiPrev.some((q) => q.isLoading)) {
        return { value: formattedValue, change: '0%', trend: 'neutral' as const, raw: scaledCurrent };
      }
      const prevValids = multiPrev.map((q) => q.data).filter((d: any) => d && d.isValid);
      const prevSum = prevValids.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
      if (prevSum === 0) {
        return { value: formattedValue, change: '0%', trend: 'neutral' as const, raw: scaledCurrent };
      }
      const diff = currentSum - prevSum;
      const changePercent = (diff / Math.abs(prevSum)) * 100;
      const trend = changePercent > 0 ? ('up' as const) : changePercent < 0 ? ('down' as const) : ('neutral' as const);
      const formattedChange = (changePercent > 0 ? '+' : '') + changePercent.toFixed(1) + '%';
      return { value: formattedValue, change: formattedChange, trend, raw: scaledCurrent };
    }

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
  }, [
    isGlobalMulti,
    multiCurrent,
    multiPrev,
    currentFormulaResult,
    previousFormulaResult,
    showTrend,
    displayAsPercentage,
    showCurrency,
    unitScale,
  ]);

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

