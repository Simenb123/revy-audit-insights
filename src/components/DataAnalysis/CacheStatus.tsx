import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Zap, RefreshCw, Trash2 } from 'lucide-react';
import { cacheService } from '@/services/cacheService';

interface CacheStatusProps {
  onInvalidateCache?: () => void;
  showDetails?: boolean;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ 
  onInvalidateCache, 
  showDetails = false 
}) => {
  const [stats, setStats] = React.useState(cacheService.getStats());
  const [isInvalidating, setIsInvalidating] = React.useState(false);

  const refreshStats = React.useCallback(() => {
    setStats(cacheService.getStats());
  }, []);

  const handleInvalidateCache = React.useCallback(async () => {
    if (isInvalidating) return;
    
    setIsInvalidating(true);
    try {
      await cacheService.invalidate({});
      refreshStats();
      onInvalidateCache?.();
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    } finally {
      setIsInvalidating(false);
    }
  }, [isInvalidating, onInvalidateCache]);

  React.useEffect(() => {
    const interval = setInterval(refreshStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Database className="h-4 w-4" />
        <span>Cache: {stats.activeEntries} aktive</span>
        <Badge variant="outline" className="text-xs">
          {stats.hitRate} treff
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Cache Status
        </CardTitle>
        <CardDescription>
          Ytelsesstatistikk for populasjonsanalyse-cache
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.activeEntries}</div>
            <div className="text-xs text-muted-foreground">Aktive oppføringer</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.hitRate}</div>
            <div className="text-xs text-muted-foreground">Cache hit rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.localCacheSize}</div>
            <div className="text-xs text-muted-foreground">Lokal cache</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.expiredEntries}</div>
            <div className="text-xs text-muted-foreground">Utløpte</div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Minnebruk:</span>
          <span className="text-sm text-muted-foreground">
            {(stats.memoryUsage / 1024).toFixed(1)} KB
          </span>
        </div>

        {/* Cache Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Oppdater
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleInvalidateCache}
            disabled={isInvalidating}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            {isInvalidating ? 'Tømmer...' : 'Tøm cache'}
          </Button>
        </div>

        {/* Performance Tips */}
        {stats.activeEntries === 0 && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
            💡 Tip: Cache vil fylles automatisk når du kjører analyser. 
            Dette reduserer lastetid betydelig for gjentatte forespørsler.
          </div>
        )}
      </CardContent>
    </Card>
  );
};