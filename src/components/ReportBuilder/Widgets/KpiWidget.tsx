import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiWidgetProps {
  widget: Widget;
}

export function KpiWidget({ widget }: KpiWidgetProps) {
  // Mock data - will be connected to real data sources later
  const mockData = {
    value: '2,450,000',
    change: '+12.5%',
    trend: 'up' as const,
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{mockData.value}</div>
        <div className="flex items-center pt-1">
          {mockData.trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-xs ${
            mockData.trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {mockData.change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}