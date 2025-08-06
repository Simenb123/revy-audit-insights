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
  
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear
  );

  // Calculate revenue from trial balance data
  const revenueData = React.useMemo(() => {
    if (!trialBalanceData?.standardAccountBalances) {
      return { value: '0', change: '0%', trend: 'up' as const };
    }

    // Look for revenue accounts (typically 3000-3999)
    const revenueAccount = trialBalanceData.standardAccountBalances.find(
      account => account.standard_number.startsWith('3')
    );
    
    const value = revenueAccount?.total_balance || 0;
    const formattedValue = new Intl.NumberFormat('no-NO').format(Math.abs(value));
    
    return {
      value: formattedValue,
      change: '+12.5%', // Mock change for now
      trend: 'up' as const,
    };
  }, [trialBalanceData]);

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
        <div className="text-2xl font-bold">{revenueData.value}</div>
        <div className="flex items-center pt-1">
          {revenueData.trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-xs ${
            revenueData.trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {revenueData.change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}