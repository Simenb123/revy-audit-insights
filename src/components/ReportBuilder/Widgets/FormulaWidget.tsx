import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { formatCurrency } from '@/lib/formatters';

interface FormulaWidgetProps {
  widget: Widget;
}

/**
 * @deprecated FormulaEvaluator class is no longer used.
 * Formula calculations are now handled by the calculate-formula edge function.
 * This code is kept for reference but should be removed in future versions.
 */

export function FormulaWidget({ widget }: FormulaWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId;

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  
  const formulaId = widget.config?.formulaId;
  const customFormula = widget.config?.customFormula;
  const showTrend = widget.config?.showTrend !== false;
  const displayAsPercentage = widget.config?.displayAsPercentage || false;
  const showCurrency = widget.config?.showCurrency !== false;

  // Validation: Ensure clientId is provided
  if (!clientId) {
    return (
      <Card className="h-full border-destructive">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <InlineEditableTitle 
              title={widget.title} 
              onTitleChange={handleTitleChange}
              size="sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Klient ikke valgt</div>
        </CardContent>
      </Card>
    );
  }
  
  // Use new formula calculation with edge function
  const formulaResult = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    formulaId,
    customFormula,
    selectedVersion: widget.config?.selectedVersion,
    enabled: !!clientId && !!selectedFiscalYear && (!!formulaId || !!customFormula)
  });

  // Calculate trend if show trend is enabled
  const previousYear = selectedFiscalYear - 1;
  const previousFormulaResult = useFormulaCalculation({
    clientId,
    fiscalYear: previousYear,
    formulaId,
    customFormula,
    selectedVersion: widget.config?.selectedVersion,
    enabled: showTrend && !!clientId && !!previousYear && (!!formulaId || !!customFormula)
  });

  // Format result based on widget configuration
  const displayResult = React.useMemo(() => {
    if (formulaResult.isLoading) {
      return { value: 'Laster...', change: null, trend: null };
    }

    if (formulaResult.error || !formulaResult.data?.isValid) {
      return { value: 'N/A', change: null, trend: null };
    }

    const value = formulaResult.data.value;
    let formattedValue: string;

    if (displayAsPercentage) {
      formattedValue = `${value.toFixed(1)}%`;
    } else if (showCurrency) {
      formattedValue = formatCurrency(value);
    } else {
      formattedValue = new Intl.NumberFormat('nb-NO', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      }).format(value);
    }

    // Calculate trend if previous data is available
    if (!showTrend || previousFormulaResult.isLoading || previousFormulaResult.error || !previousFormulaResult.data?.isValid) {
      return { value: formattedValue, change: null, trend: null };
    }

    const previousValue = previousFormulaResult.data.value;
    if (previousValue === 0) {
      return { value: formattedValue, change: null, trend: null };
    }

    const diff = value - previousValue;
    const changePercent = (diff / Math.abs(previousValue)) * 100;
    const trend = changePercent > 0 ? 'up' as const : changePercent < 0 ? 'down' as const : null;
    const formattedChange = (changePercent > 0 ? '+' : '') + changePercent.toFixed(1) + '%';

    return {
      value: formattedValue,
      change: formattedChange,
      trend
    };
  }, [formulaResult, previousFormulaResult, displayAsPercentage, showCurrency, showTrend]);

  if (formulaResult.isLoading) {
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
          <div className="text-2xl font-bold">Laster...</div>
        </CardContent>
      </Card>
    );
  }

  if (!formulaId && !customFormula) {
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
          <div className="text-sm text-muted-foreground">Ingen formel konfigurert</div>
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
        <div className="text-2xl font-bold">{displayResult.value}</div>
        {showTrend && displayResult.change && displayResult.trend && (
          <div className="flex items-center pt-1">
            {displayResult.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-success mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive mr-1" />
            )}
            <span className={`text-xs ${
              displayResult.trend === 'up' ? 'text-success' : 'text-destructive'
            }`}>
              {displayResult.change}
            </span>
          </div>
        )}
        {showTrend && !displayResult.change && (
          <div className="text-xs text-muted-foreground pt-1">
            Ingen historiske data tilgjengelig
          </div>
        )}
        {formulaResult.data?.error && (
          <div className="mt-2 text-xs text-destructive">
            {formulaResult.data.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}