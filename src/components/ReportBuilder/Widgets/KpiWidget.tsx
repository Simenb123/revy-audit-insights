import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
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

  // Calculate metric data from trial balance data
  const metricData = React.useMemo(() => {
    if (!trialBalanceData?.standardAccountBalances) {
      return { value: '0', change: '0%', trend: 'neutral' as const };
    }

    const getMetricValue = (data: typeof trialBalanceData) => {
      if (!data?.standardAccountBalances) return 0;
      switch (metric) {
        case 'revenue':
          return (
            data.standardAccountBalances.find(account =>
              account.standard_number.startsWith('3')
            )?.total_balance || 0
          );
        case 'expenses':
          return (
            data.standardAccountBalances.find(account =>
              account.standard_number.startsWith('4') ||
              account.standard_number.startsWith('5')
            )?.total_balance || 0
          );
        case 'result':
          const revenue =
            data.standardAccountBalances.find(account =>
              account.standard_number.startsWith('3')
            )?.total_balance || 0;
          const expenses = data.standardAccountBalances
            .filter(account =>
              account.standard_number.startsWith('4') ||
              account.standard_number.startsWith('5')
            )
            .reduce((sum, acc) => sum + acc.total_balance, 0);
          return revenue + expenses;
        case 'assets':
          return (
            data.standardAccountBalances.find(account =>
              account.standard_number.startsWith('1')
            )?.total_balance || 0
          );
        case 'equity':
          return (
            data.standardAccountBalances.find(account =>
              account.standard_number.startsWith('2')
            )?.total_balance || 0
          );
        default:
          return data.standardAccountBalances[0]?.total_balance || 0;
      }
    };

    const currentValue = getMetricValue(trialBalanceData);
    const previousValue = previousTrialBalanceData?.standardAccountBalances
      ? getMetricValue(previousTrialBalanceData)
      : null;
    const prefix = 'kr ';
    const formattedValue =
      prefix + new Intl.NumberFormat('no-NO').format(Math.abs(currentValue));

    if (!previousValue) {
      return { value: formattedValue, change: '0%', trend: 'neutral' as const };
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
    };
  }, [trialBalanceData, previousTrialBalanceData, metric]);

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