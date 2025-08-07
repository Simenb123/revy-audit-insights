import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaCalculator } from '@/hooks/useFormulaCalculator';
import { InlineEditableTitle } from '../InlineEditableTitle';

interface KpiWidgetProps {
  widget: Widget;
}

export function KpiWidget({ widget }: KpiWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId;
  const metric = widget.config?.metric || 'revenue';
  const showTrend = widget.config?.showTrend !== false;

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId,
    selectedFiscalYear,
    widget.config?.selectedVersion
  );
  const previousFiscalYear = selectedFiscalYear - 1;
  const { data: previousTrialBalanceData } = useTrialBalanceWithMappings(
    clientId,
    previousFiscalYear,
    widget.config?.selectedVersion
  );

  const calculator = useFormulaCalculator(trialBalanceData?.standardAccountBalances || []);
  const previousCalculator = useFormulaCalculator(previousTrialBalanceData?.standardAccountBalances || []);

  // Calculate metric data using formula calculator
  const metricData = React.useMemo(() => {
    if (!trialBalanceData?.standardAccountBalances) {
      return { value: '0', change: '0%', trend: 'neutral' as const };
    }

    // Get current value using formula calculator
    let currentResult;
    switch (metric) {
      case 'revenue':
        // Create a temporary formula for revenue
        const revenueValue = calculator.calculatePrefixSum('3');
        currentResult = {
          value: Math.abs(revenueValue),
          formattedValue: `kr ${new Intl.NumberFormat('no-NO').format(Math.abs(revenueValue))}`,
          isValid: true
        };
        break;
      case 'assets':
        const assetsValue = calculator.calculatePrefixSum('1');
        currentResult = {
          value: assetsValue,
          formattedValue: `kr ${new Intl.NumberFormat('no-NO').format(Math.abs(assetsValue))}`,
          isValid: true
        };
        break;
      case 'equity':
        const equityValue = calculator.calculatePrefixSum('20');
        currentResult = {
          value: equityValue,
          formattedValue: `kr ${new Intl.NumberFormat('no-NO').format(Math.abs(equityValue))}`,
          isValid: true
        };
        break;
      case 'result':
        // Calculate operating result using formula
        currentResult = {
          ...calculator.calculateFormula('operating_result'),
          formattedValue: `kr ${new Intl.NumberFormat('no-NO').format(Math.abs(calculator.calculateFormula('operating_result').value))}`
        };
        break;
      default:
        // Try to use the metric as a formula name
        currentResult = calculator.calculateFormula(metric);
        break;
    }

    if (!currentResult.isValid) {
      return { value: 'N/A', change: '0%', trend: 'neutral' as const };
    }

    // Calculate previous value if available
    let previousResult = null;
    if (previousTrialBalanceData?.standardAccountBalances) {
      switch (metric) {
        case 'revenue':
          const prevRevenueValue = previousCalculator.calculatePrefixSum('3');
          previousResult = { value: Math.abs(prevRevenueValue), isValid: true };
          break;
        case 'assets':
          const prevAssetsValue = previousCalculator.calculatePrefixSum('1');
          previousResult = { value: prevAssetsValue, isValid: true };
          break;
        case 'equity':
          const prevEquityValue = previousCalculator.calculatePrefixSum('20');
          previousResult = { value: prevEquityValue, isValid: true };
          break;
        case 'result':
          previousResult = previousCalculator.calculateFormula('operating_result');
          break;
        default:
          previousResult = previousCalculator.calculateFormula(metric);
          break;
      }
    }

    if (!previousResult?.isValid || previousResult.value === 0) {
      return { value: currentResult.formattedValue, change: '0%', trend: 'neutral' as const };
    }

    const diff = currentResult.value - previousResult.value;
    const changePercent = (diff / Math.abs(previousResult.value)) * 100;
    const trend =
      changePercent > 0
        ? ('up' as const)
        : changePercent < 0
        ? ('down' as const)
        : ('neutral' as const);
    const formattedChange =
      (changePercent > 0 ? '+' : '') + changePercent.toFixed(1) + '%';

    return {
      value: currentResult.formattedValue,
      change: formattedChange,
      trend,
    };
  }, [trialBalanceData, previousTrialBalanceData, metric, calculator, previousCalculator]);

  if (isLoading) {
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
        <div className="text-2xl font-bold">{metricData.value}</div>
        {showTrend && (
          <div className="flex items-center pt-1">
            {metricData.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : metricData.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            ) : (
              <Minus className="h-4 w-4 text-gray-500 mr-1" />
            )}
            <span
              className={`text-xs ${
                metricData.trend === 'up'
                  ? 'text-green-500'
                  : metricData.trend === 'down'
                  ? 'text-red-500'
                  : 'text-gray-500'
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