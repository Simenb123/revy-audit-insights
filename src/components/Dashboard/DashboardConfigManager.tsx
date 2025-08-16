import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  Save, 
  FolderOpen, 
  Trash2, 
  Copy,
  Share,
  Settings
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  widgets: any[];
  layouts: any[];
  settings: {
    theme?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
    columns?: Record<string, number>;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    author?: string;
  };
}

interface DashboardConfigManagerProps {
  className?: string;
}

export function DashboardConfigManager({ className }: DashboardConfigManagerProps) {
  const { widgets, layouts, setWidgets, updateLayout, clearWidgets } = useWidgetManager();
  const { toast } = useToast();
  const [savedConfigs, setSavedConfigs] = useState<DashboardConfig[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');

  // Load saved configurations from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('dashboard-configs');
    if (stored) {
      try {
        setSavedConfigs(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load dashboard configs:', error);
      }
    }
  }, []);

  // Save configurations to localStorage
  const saveConfigsToStorage = useCallback((configs: DashboardConfig[]) => {
    localStorage.setItem('dashboard-configs', JSON.stringify(configs));
    setSavedConfigs(configs);
  }, []);

  // Create current dashboard configuration
  const createCurrentConfig = useCallback((name: string, description?: string): DashboardConfig => {
    return {
      id: Date.now().toString(),
      name,
      description,
      widgets,
      layouts,
      settings: {
        autoRefresh: false,
        refreshInterval: 30000,
        columns: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        author: 'Bruker'
      }
    };
  }, [widgets, layouts]);

  // Save current configuration
  const handleSaveConfig = useCallback(() => {
    if (!configName.trim()) {
      toast({
        title: "Feil",
        description: "Konfigurasjonsnavn er påkrevd",
        variant: "destructive"
      });
      return;
    }

    const config = createCurrentConfig(configName, configDescription);
    const updatedConfigs = [...savedConfigs, config];
    saveConfigsToStorage(updatedConfigs);

    toast({
      title: "Konfigurasjon lagret",
      description: `Dashboard-konfigurasjon "${configName}" er lagret`
    });

    setConfigName('');
    setConfigDescription('');
    setShowSaveDialog(false);
  }, [configName, configDescription, createCurrentConfig, savedConfigs, saveConfigsToStorage, toast]);

  // Load configuration
  const handleLoadConfig = useCallback((config: DashboardConfig) => {
    clearWidgets();
    setWidgets(config.widgets);
    updateLayout(config.layouts);

    toast({
      title: "Konfigurasjon lastet",
      description: `Dashboard-konfigurasjon "${config.name}" er lastet`
    });

    setShowLoadDialog(false);
  }, [clearWidgets, setWidgets, updateLayout, toast]);

  // Delete configuration
  const handleDeleteConfig = useCallback((configId: string) => {
    const updatedConfigs = savedConfigs.filter(c => c.id !== configId);
    saveConfigsToStorage(updatedConfigs);

    toast({
      title: "Konfigurasjon slettet",
      description: "Dashboard-konfigurasjonen er slettet"
    });

    setShowDeleteDialog(null);
  }, [savedConfigs, saveConfigsToStorage, toast]);

  // Export configuration to JSON
  const handleExportConfig = useCallback((config: DashboardConfig) => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-${config.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Konfigurasjon eksportert",
      description: `Filen "dashboard-${config.name.replace(/\s+/g, '-')}.json" lastes ned`
    });
  }, [toast]);

  // Import configuration from JSON
  const handleImportConfig = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string) as DashboardConfig;
        
        // Validate configuration structure
        if (!config.widgets || !config.layouts || !config.name) {
          throw new Error('Ugyldig konfigurasjonsfil');
        }

        // Update ID and timestamps
        config.id = Date.now().toString();
        config.metadata.updatedAt = new Date().toISOString();

        const updatedConfigs = [...savedConfigs, config];
        saveConfigsToStorage(updatedConfigs);

        toast({
          title: "Konfigurasjon importert",
          description: `Dashboard-konfigurasjon "${config.name}" er importert`
        });
      } catch (error) {
        toast({
          title: "Import feilet",
          description: "Kunne ikke importere konfigurasjonsfil",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  }, [savedConfigs, saveConfigsToStorage, toast]);

  // Duplicate configuration
  const handleDuplicateConfig = useCallback((config: DashboardConfig) => {
    const duplicatedConfig = {
      ...config,
      id: Date.now().toString(),
      name: `${config.name} (Kopi)`,
      metadata: {
        ...config.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const updatedConfigs = [...savedConfigs, duplicatedConfig];
    saveConfigsToStorage(updatedConfigs);

    toast({
      title: "Konfigurasjon duplisert",
      description: `"${duplicatedConfig.name}" er opprettet`
    });
  }, [savedConfigs, saveConfigsToStorage, toast]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Dashboard Konfigurasjoner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Lagre gjeldende
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lagre Dashboard-konfigurasjon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="config-name">Navn</Label>
                  <Input
                    id="config-name"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="Navn på konfigurasjon"
                  />
                </div>
                <div>
                  <Label htmlFor="config-description">Beskrivelse (valgfri)</Label>
                  <Textarea
                    id="config-description"
                    value={configDescription}
                    onChange={(e) => setConfigDescription(e.target.value)}
                    placeholder="Beskrivelse av konfigurasjon"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleSaveConfig}>
                  Lagre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Last konfigurasjon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Last Dashboard-konfigurasjon</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedConfigs.map((config) => (
                  <div key={config.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{config.name}</h4>
                        {config.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{config.widgets.length} widgets</span>
                          <span>Opprettet: {new Date(config.metadata.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadConfig(config)}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateConfig(config)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportConfig(config)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteDialog(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {savedConfigs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Ingen lagrede konfigurasjoner
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" asChild>
            <label htmlFor="import-config" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Importer
              <input
                id="import-config"
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
            </label>
          </Button>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slett konfigurasjon</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette denne konfigurasjonen? Dette kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => showDeleteDialog && handleDeleteConfig(showDeleteDialog)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Slett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}