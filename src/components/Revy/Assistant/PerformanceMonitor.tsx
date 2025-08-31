import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Zap, 
  Clock, 
  Database, 
  TrendingUp, 
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { advancedCacheManager } from '@/services/advancedCacheManager';
import { toast } from 'sonner';

interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  totalRequests: number;
  activeSessions: number;
  memoryUsage: number;
  lastUpdateTime: Date;
}

interface PerformanceMonitorProps {
  showDetailedView?: boolean;
  refreshInterval?: number;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetailedView = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalRequests: 0,
    activeSessions: 0,
    memoryUsage: 0,
    lastUpdateTime: new Date()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheDetails, setCacheDetails] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
    
    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadMetrics = async () => {
    try {
      // Get cache metrics
      const cacheMetrics = advancedCacheManager.getMetrics();
      
      // Simulate other performance metrics (in real app, these would come from various sources)
      const performanceData: PerformanceMetrics = {
        cacheHitRate: cacheMetrics.hitRate,
        averageResponseTime: cacheMetrics.averageResponseTime,
        totalRequests: cacheMetrics.totalRequests,
        activeSessions: Math.floor(Math.random() * 20) + 5, // Simulated
        memoryUsage: Math.floor(Math.random() * 40) + 30, // Simulated percentage
        lastUpdateTime: new Date()
      };
      
      setMetrics(performanceData);
      setCacheDetails(cacheMetrics);
      
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMetrics();
    setIsRefreshing(false);
    toast.success('Performance metrics oppdatert');
  };

  const clearCache = async () => {
    try {
      await advancedCacheManager.invalidate(/.*$/);
      await loadMetrics();
      toast.success('Cache tømt', {
        description: 'Alle cache-oppføringer er fjernet'
      });
    } catch (error) {
      toast.error('Kunne ikke tømme cache', {
        description: 'Prøv igjen senere'
      });
    }
  };

  const getPerformanceStatus = (value: number, thresholds: { good: number; ok: number }) => {
    if (value >= thresholds.good) return { status: 'good', color: 'text-green-600', icon: CheckCircle };
    if (value >= thresholds.ok) return { status: 'ok', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'poor', color: 'text-red-600', icon: AlertTriangle };
  };

  const hitRateStatus = getPerformanceStatus(metrics.cacheHitRate, { good: 70, ok: 50 });
  const responseTimeStatus = getPerformanceStatus(
    metrics.averageResponseTime > 0 ? Math.max(0, 100 - (metrics.averageResponseTime / 50)) : 100, 
    { good: 80, ok: 60 }
  );

  if (!showDetailedView) {
    // Compact view for embedded use
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            Ytelse
            <Badge variant="outline" className="text-xs">
              {metrics.cacheHitRate.toFixed(1)}% cache
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{metrics.averageResponseTime.toFixed(0)}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>{metrics.totalRequests} req</span>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed view
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            AI Revy Ytelsesmonitor
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {metrics.lastUpdateTime.toLocaleTimeString()}
            </Badge>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Sanntids ytelsesstatistikk for AI Revy systemet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <hitRateStatus.icon className={`h-4 w-4 ${hitRateStatus.color}`} />
              <span className="text-sm font-medium">Cache Hit Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.cacheHitRate.toFixed(1)}%
            </div>
            <Progress value={metrics.cacheHitRate} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <responseTimeStatus.icon className={`h-4 w-4 ${responseTimeStatus.color}`} />
              <span className="text-sm font-medium">Responstid</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.averageResponseTime.toFixed(0)}ms
            </div>
            <Progress 
              value={Math.max(0, 100 - (metrics.averageResponseTime / 50))} 
              className="h-2" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Aktive sesjoner</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.activeSessions}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.totalRequests} totale forespørsler
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Minnebruk</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.memoryUsage}%
            </div>
            <Progress value={metrics.memoryUsage} className="h-2" />
          </div>
        </div>

        <Separator />

        {/* Cache Details */}
        {cacheDetails && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache detaljer
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Cache hits</div>
                <div className="font-medium">{cacheDetails.hits}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cache misses</div>
                <div className="font-medium">{cacheDetails.misses}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Evictions</div>
                <div className="font-medium">{cacheDetails.evictions}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Strategier</div>
                <div className="font-medium">{Object.keys(cacheDetails.strategies).length}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium">Cache strategier:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(cacheDetails.strategies).map(([key, strategy]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between text-xs p-2 rounded bg-muted/50">
                    <span>{strategy.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {strategy.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Sist oppdatert: {metrics.lastUpdateTime.toLocaleString()}
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={clearCache}>
              Tøm cache
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <TrendingUp className="h-4 w-4 mr-1" />
              Full rapport
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;