import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Widget } from '@/contexts/WidgetManagerContext';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardWidgetProps {
  widget: Widget;
}

export function MetricCardWidget({ widget }: MetricCardWidgetProps) {
  // Mock data for now - in real implementation, this would come from API
  const mockData = {
    value: 1250000,
    previousValue: 1100000,
    target: 1300000,
    unit: widget.config?.unit || 'currency',
    showTrend: widget.config?.showTrend !== false,
    showTarget: widget.config?.showTarget === true,
    color: widget.config?.color || 'blue'
  };

  const change = mockData.value - mockData.previousValue;
  const changePercent = ((change / mockData.previousValue) * 100);
  const targetProgress = (mockData.value / mockData.target) * 100;

  const formatValue = (value: number) => {
    switch (mockData.unit) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('nb-NO').format(value);
      default:
        return value.toString();
    }
  };

  const getTrendIcon = () => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            {formatValue(mockData.value)}
          </div>
          
          {mockData.showTrend && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                vs forrige periode
              </span>
            </div>
          )}

          {mockData.showTarget && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Måloppnåelse</span>
                <span className="font-medium">{targetProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    targetProgress >= 100 ? 'bg-green-500' : 
                    targetProgress >= 80 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(targetProgress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Mål: {formatValue(mockData.target)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}