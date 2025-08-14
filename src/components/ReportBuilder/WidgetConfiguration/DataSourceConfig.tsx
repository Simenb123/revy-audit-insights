import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Activity, AlertCircle } from 'lucide-react';
import { dataSourceManager, type DataSource } from '@/lib/dataSource';
import { useDataSource } from '@/hooks/useDataSource';

interface DataSourceConfigProps {
  widgetId: string;
  dataSourceId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onDataSourceChange: (dataSourceId: string) => void;
  onAutoRefreshChange: (enabled: boolean) => void;
  onRefreshIntervalChange: (interval: number) => void;
}

export function DataSourceConfig({
  widgetId,
  dataSourceId,
  autoRefresh = true,
  refreshInterval = 15,
  onDataSourceChange,
  onAutoRefreshChange,
  onRefreshIntervalChange
}: DataSourceConfigProps) {
  const [dataSources] = useState(dataSourceManager.getAllDataSources());
  const { data, loading, error, lastUpdated, refresh } = useDataSource(dataSourceId || '', {
    autoRefresh,
    refreshInterval
  });

  const selectedSource = dataSourceId ? dataSourceManager.getDataSource(dataSourceId) : null;

  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Datakilde</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Velg datakilde og konfigurer oppdateringsinnstillinger for denne widgeten.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="data-source">Velg datakilde</Label>
        <Select value={dataSourceId || ""} onValueChange={onDataSourceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Velg en datakilde..." />
          </SelectTrigger>
          <SelectContent>
            {dataSources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {source.name}
                  <Badge variant={source.isActive ? "default" : "secondary"} className="text-xs">
                    {source.type}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSource && (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{selectedSource.name}</h4>
                <Badge variant={selectedSource.isActive ? "default" : "secondary"}>
                  {selectedSource.type}
                </Badge>
                {selectedSource.isActive && (
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Aktiv
                  </Badge>
                )}
              </div>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  Sist oppdatert: {formatLastUpdated(lastUpdated)}
                </p>
              )}
              {error && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading || !selectedSource.isActive}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Automatisk oppdatering</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={onAutoRefreshChange}
                />
                <span className="text-sm text-muted-foreground">
                  {autoRefresh ? 'På' : 'Av'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Oppdateringsintervall</Label>
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => onRefreshIntervalChange(Number(value))}
                disabled={!autoRefresh}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutter</SelectItem>
                  <SelectItem value="15">15 minutter</SelectItem>
                  <SelectItem value="30">30 minutter</SelectItem>
                  <SelectItem value="60">1 time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {data && (
            <div className="space-y-2">
              <Label>Dataforhåndsvisning</Label>
              <div className="bg-muted rounded p-2 text-xs font-mono max-h-32 overflow-auto">
                <pre>{JSON.stringify(Array.isArray(data) ? data.slice(0, 3) : data, null, 2)}</pre>
                {Array.isArray(data) && data.length > 3 && (
                  <p className="text-muted-foreground mt-2">
                    ... og {data.length - 3} flere poster
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}