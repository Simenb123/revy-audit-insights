import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWidgetCache } from '@/services/widgetCacheManager';
import { Activity, Clock, Database, TrendingUp } from 'lucide-react';

interface WidgetPerformanceMonitorProps {
  className?: string;
}

export const WidgetPerformanceMonitor = memo(function WidgetPerformanceMonitor({
  className = ''
}: WidgetPerformanceMonitorProps) {
  const { getStats, getInfo } = useWidgetCache();
  const stats = getStats();
  const info = getInfo();

  const getPerformanceColor = (hitRate: number) => {
    if (hitRate >= 80) return 'bg-success';
    if (hitRate >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const getPerformanceStatus = (hitRate: number) => {
    if (hitRate >= 80) return 'Excellent';
    if (hitRate >= 60) return 'Good';
    if (hitRate >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Cache Hit Rate */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{stats.hitRate.toFixed(1)}%</p>
              <Badge 
                variant={stats.hitRate >= 80 ? 'default' : stats.hitRate >= 60 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {getPerformanceStatus(stats.hitRate)}
              </Badge>
            </div>
            <Progress 
              value={stats.hitRate} 
              className="mt-2 h-2"
            />
          </div>
        </div>
      </Card>

      {/* Total Requests */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-green-600">Hits: {stats.hitCount}</span>
              <span className="text-xs text-red-600">Misses: {stats.missCount}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Cache Size */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Database className="h-5 w-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Cache Size</p>
            <p className="text-2xl font-bold">{info.size}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {info.entries} entries
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Score */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Performance</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {Math.round(stats.hitRate * 0.7 + (stats.totalRequests > 0 ? 30 : 0))}
              </p>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall system performance
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
});

export default WidgetPerformanceMonitor;