import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Database, RefreshCw, Plus, Settings, Activity } from 'lucide-react';
import { dataSourceManager, type DataSource } from '@/lib/dataSource';
import { useToast } from '@/hooks/use-toast';

interface DataSourceManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataSourceManager({ open, onOpenChange }: DataSourceManagerProps) {
  const [dataSources, setDataSources] = useState(dataSourceManager.getAllDataSources());
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRefreshSource = async (sourceId: string) => {
    setIsRefreshing(sourceId);
    try {
      await dataSourceManager.refreshDataSource(sourceId);
      toast({
        title: "Datakilde oppdatert",
        description: "Data er hentet på nytt fra kilden.",
      });
    } catch (error) {
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere datakilden.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(null);
    }
  };

  const handleToggleSource = (source: DataSource) => {
    const updatedSource = { ...source, isActive: !source.isActive };
    dataSourceManager.updateDataSource(updatedSource);
    setDataSources(dataSourceManager.getAllDataSources());
    toast({
      title: source.isActive ? "Datakilde deaktivert" : "Datakilde aktivert",
      description: `${source.name} er nå ${source.isActive ? 'deaktivert' : 'aktivert'}.`,
    });
  };

  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Datakildeadministrasjon
          </DialogTitle>
          <DialogDescription>
            Administrer datakilder og deres oppdateringsintervaller.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sources" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sources">Datakilder</TabsTrigger>
            <TabsTrigger value="settings">Innstillinger</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="flex-1">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {dataSources.map((source) => (
                  <div
                    key={source.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{source.name}</h4>
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.type}
                          </Badge>
                          {source.isActive && (
                            <Badge variant="outline" className="text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              Aktiv
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {source.lastUpdated && (
                            <>Sist oppdatert: {formatLastUpdated(source.lastUpdated)}</>
                          )}
                          {source.refreshInterval && (
                            <> • Oppdateres hver {source.refreshInterval} min</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={source.isActive}
                          onCheckedChange={() => handleToggleSource(source)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefreshSource(source.id)}
                          disabled={isRefreshing === source.id || !source.isActive}
                        >
                          <RefreshCw className={`h-4 w-4 ${isRefreshing === source.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSource(source)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {source.type === 'mock' && (
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-xs text-muted-foreground">
                          Demonstrasjonsdata • {Array.isArray(source.config.data) ? source.config.data.length : 0} poster
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Globale innstillinger</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Standard oppdateringsintervall</Label>
                    <Select defaultValue="15">
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

                  <div className="space-y-2">
                    <Label>Maks cache-tid</Label>
                    <Select defaultValue="60">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutter</SelectItem>
                        <SelectItem value="60">1 time</SelectItem>
                        <SelectItem value="240">4 timer</SelectItem>
                        <SelectItem value="1440">24 timer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatisk oppdatering</Label>
                    <p className="text-sm text-muted-foreground">
                      Oppdater data automatisk basert på intervaller
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Offline-modus</Label>
                    <p className="text-sm text-muted-foreground">
                      Bruk cached data når nettverket er utilgjengelig
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til ny datakilde
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}