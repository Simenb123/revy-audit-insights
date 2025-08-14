import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Widget } from '@/contexts/WidgetManagerContext';
import { WidgetPreview } from '../WidgetPreview';
import { WidgetStyleConfig } from './WidgetStyleConfig';
import { ConditionalFormatting } from './ConditionalFormatting';
import { DataSourceConfig } from './DataSourceConfig';
import { Settings, Palette, Zap, Database, Eye } from 'lucide-react';

interface WidgetConfigurationProps {
  widget: Widget;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Widget>) => void;
}

export function WidgetConfiguration({ widget, isOpen, onClose, onSave }: WidgetConfigurationProps) {
  const [title, setTitle] = useState(widget.title);
  const [config, setConfig] = useState(widget.config || {});

  const handleSave = () => {
    onSave({
      title,
      config
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Konfigurer widget</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Configuration Panel */}
          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="space-y-2">
              <Label htmlFor="widget-title">Tittel</Label>
              <Input
                id="widget-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Widget tittel"
              />
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general" className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  <span className="hidden sm:inline">Generelt</span>
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span className="hidden sm:inline">Data</span>
                </TabsTrigger>
                <TabsTrigger value="style" className="flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  <span className="hidden sm:inline">Stil</span>
                </TabsTrigger>
                <TabsTrigger value="conditional" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="hidden sm:inline">Betinget</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">Forhåndsvisning</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Widget-type</Label>
                    <div className="text-sm text-muted-foreground capitalize">{widget.type}</div>
                  </div>
                  
                  {/* Widget-specific general configuration */}
                  {widget.type === 'kpi' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="show-trend"
                          checked={config.showTrend !== false}
                          onChange={(e) => setConfig({ ...config, showTrend: e.target.checked })}
                        />
                        <Label htmlFor="show-trend">Vis trend</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="show-currency"
                          checked={config.showCurrency !== false}
                          onChange={(e) => setConfig({ ...config, showCurrency: e.target.checked })}
                        />
                        <Label htmlFor="show-currency">Vis valuta</Label>
                      </div>
                    </div>
                  )}
                  
                  {widget.type === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="text-content">Innhold</Label>
                      <textarea
                        id="text-content"
                        value={config.content || ''}
                        onChange={(e) => setConfig({ ...config, content: e.target.value })}
                        placeholder="Skriv inn tekst..."
                        className="w-full h-24 p-2 border rounded-md"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="data" className="mt-4">
                <DataSourceConfig config={config} onChange={setConfig} />
              </TabsContent>

              <TabsContent value="style" className="mt-4">
                <WidgetStyleConfig config={config} onChange={setConfig} />
              </TabsContent>

              <TabsContent value="conditional" className="mt-4">
                <ConditionalFormatting config={config} onChange={setConfig} />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Se hvordan widget-en vil se ut med gjeldende innstillinger
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="sticky top-0">
              <Label className="text-sm font-medium">Forhåndsvisning</Label>
              <div className="mt-2 p-4 bg-muted/20 rounded-lg">
                <WidgetPreview
                  type={widget.type}
                  title={title}
                  config={config}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={handleSave}>
            Lagre endringer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}