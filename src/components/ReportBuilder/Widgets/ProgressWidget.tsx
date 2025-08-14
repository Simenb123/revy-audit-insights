import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Widget } from '@/contexts/WidgetManagerContext';
import { formatCurrency } from '@/lib/formatters';
import { Target, Award, AlertCircle } from 'lucide-react';

interface ProgressWidgetProps {
  widget: Widget;
}

interface ProgressItem {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: 'currency' | 'percentage' | 'number';
  color?: string;
}

export function ProgressWidget({ widget }: ProgressWidgetProps) {
  // Mock data - in real implementation this would come from API
  const mockItems: ProgressItem[] = [
    {
      id: '1',
      label: 'Månedlig omsetning',
      current: 850000,
      target: 1000000,
      unit: 'currency',
      color: 'blue'
    },
    {
      id: '2', 
      label: 'Bruttomargin',
      current: 28.5,
      target: 35,
      unit: 'percentage',
      color: 'green'
    },
    {
      id: '3',
      label: 'Nye kunder',
      current: 12,
      target: 20,
      unit: 'number',
      color: 'purple'
    },
    {
      id: '4',
      label: 'Kostnader',
      current: 720000,
      target: 650000,
      unit: 'currency',
      color: 'red'
    }
  ];

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
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

  const getProgressStatus = (current: number, target: number, unit: string) => {
    // For costs, lower is better
    const isReversed = unit === 'currency' && current > target;
    const progress = isReversed ? 
      Math.max(0, (target / current) * 100) :
      Math.min(100, (current / target) * 100);
      
    let status: 'excellent' | 'good' | 'warning' | 'poor';
    if (progress >= 100) status = 'excellent';
    else if (progress >= 80) status = 'good';
    else if (progress >= 60) status = 'warning';
    else status = 'poor';

    return { progress, status, isReversed };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'good':
        return <Target className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockItems.map((item) => {
            const { progress, status, isReversed } = getProgressStatus(
              item.current, 
              item.target, 
              item.unit
            );

            return (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress >= 100 ? 'bg-green-500' : 
                      progress >= 80 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Nå: {formatValue(item.current, item.unit)}
                  </span>
                  <span>
                    Mål: {formatValue(item.target, item.unit)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}