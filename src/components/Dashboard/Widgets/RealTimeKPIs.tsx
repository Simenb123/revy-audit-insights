
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';

const RealTimeKPIs = () => {
  // Mock real-time data - replace with actual API calls
  const kpis = [
    {
      title: 'Aktive Klienter',
      value: 127,
      change: +8,
      changePercent: 6.7,
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Pågående Revisjoner',
      value: 34,
      change: -2,
      changePercent: -5.6,
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Fullførte Handlinger',
      value: 892,
      change: +47,
      changePercent: 5.6,
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Høyrisiko Klienter',
      value: 12,
      change: +3,
      changePercent: 33.3,
      trend: 'up',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <h3 className="text-2xl font-bold">{kpi.value}</h3>
                    <Badge 
                      variant={kpi.trend === 'up' ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      <TrendIcon className="h-3 w-3" />
                      {Math.abs(kpi.changePercent)}%
                    </Badge>
                  </div>
                  <p className={`text-xs mt-1 ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change} siden i går
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RealTimeKPIs;
