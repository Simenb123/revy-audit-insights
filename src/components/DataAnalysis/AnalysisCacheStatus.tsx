import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, Clock, Zap } from 'lucide-react';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';

interface AnalysisCacheStatusProps {
  clientId: string;
  lastUpdated?: string | null;
  isCached?: boolean;
}

export function AnalysisCacheStatus({ clientId, lastUpdated, isCached = false }: AnalysisCacheStatusProps) {
  const { invalidateClientCache, isInvalidating } = useCacheInvalidation();

  const handleClearCache = async () => {
    try {
      await invalidateClientCache(clientId);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          Cache Status
          <Badge variant={isCached ? "default" : "secondary"} className="ml-auto">
            {isCached ? (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Cached
              </>
            ) : (
              'Fresh'
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            disabled={isInvalidating}
            className="text-xs h-7"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isInvalidating ? 'animate-spin' : ''}`} />
            Clear Cache
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isCached 
            ? "Data served from cache for fast loading. Cache expires in 30 minutes." 
            : "Fresh data computed from database. Results will be cached for 30 minutes."
          }
        </div>
      </CardContent>
    </Card>
  );
}