import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface KpiWidgetProps {
  widget: Widget;
}

export function KpiWidget({ widget }: KpiWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = widget.config?.clientId;
  const metric = widget.config?.metric || 'revenue';
  const showTrend = widget.config?.showTrend !== false;
  
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear,
    widget.config?.selectedVersion
  );

  // Calculate metric data from trial balance data
  const metricData = React.useMemo(() => {
    if (!trialBalanceData?.standardAccountBalances) {
      return { value: '0', change: '0%', trend: 'up' as const };
    }

    let targetAccount;
    let prefix = '';
    
    switch (metric) {
      case 'revenue':
        targetAccount = trialBalanceData.standardAccountBalances.find(
          account => account.standard_number.startsWith('3')
        );
        prefix = 'kr ';
        break;
      case 'expenses':
        targetAccount = trialBalanceData.standardAccountBalances.find(
          account => account.standard_number.startsWith('4') || account.standard_number.startsWith('5')
        );
        prefix = 'kr ';
        break;
      case 'result':
        const revenue = trialBalanceData.standardAccountBalances.find(
          account => account.standard_number.startsWith('3')
        )?.total_balance || 0;
        const expenses = trialBalanceData.standardAccountBalances.filter(
          account => account.standard_number.startsWith('4') || account.standard_number.startsWith('5')
        ).reduce((sum, acc) => sum + acc.total_balance, 0);
        targetAccount = { total_balance: revenue + expenses };
        prefix = 'kr ';
        break;
      case 'assets':
        targetAccount = trialBalanceData.standardAccountBalances.find(
          account => account.standard_number.startsWith('1')
        );
        prefix = 'kr ';
        break;
      case 'equity':
        targetAccount = trialBalanceData.standardAccountBalances.find(
          account => account.standard_number.startsWith('2')
        );
        prefix = 'kr ';
        break;
      default:
        targetAccount = trialBalanceData.standardAccountBalances[0];
        prefix = 'kr ';
    }
    
    const value = targetAccount?.total_balance || 0;
    const formattedValue = prefix + new Intl.NumberFormat('no-NO').format(Math.abs(value));
    
    return {
      value: formattedValue,
      change: '+12.5%', // Mock change for now
      trend: 'up' as const,
    };
  }, [trialBalanceData, metric]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
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
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metricData.value}</div>
        {showTrend && (
          <div className="flex items-center pt-1">
            {metricData.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${
              metricData.trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              {metricData.change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}