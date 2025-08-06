import React, { useState } from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save } from 'lucide-react';
import { FormulaWidgetConfig } from './WidgetConfiguration/FormulaWidgetConfig';

interface WidgetConfigurationProps {
  widget: Widget;
  onUpdateWidget: (updates: Partial<Widget>) => void;
}

export function WidgetConfiguration({ widget, onUpdateWidget }: WidgetConfigurationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(widget.title);
  const [config, setConfig] = useState(widget.config || {});

  // Mock standard accounts for now - should come from props or context
  const standardAccounts = [
    { standard_number: '1000', standard_name: 'Anleggsmidler' },
    { standard_number: '1500', standard_name: 'Omløpsmidler' },
    { standard_number: '2000', standard_name: 'Egenkapital' },
    { standard_number: '2500', standard_name: 'Kortsiktig gjeld' },
    { standard_number: '3000', standard_name: 'Salgsinntekter' },
    { standard_number: '4000', standard_name: 'Varekostnad' },
    { standard_number: '5000', standard_name: 'Lønnskostnad' },
    { standard_number: '6000', standard_name: 'Andre driftskostnader' }
  ];

  const handleSave = () => {
    onUpdateWidget({
      title,
      config: { ...widget.config, ...config }
    });
    setIsOpen(false);
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderTypeSpecificConfig = () => {
    switch (widget.type) {
      case 'kpi':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="metric">Nøkkeltall</Label>
              <Select 
                value={config.metric || 'revenue'} 
                onValueChange={(value) => updateConfig('metric', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Omsetning</SelectItem>
                  <SelectItem value="expenses">Kostnader</SelectItem>
                  <SelectItem value="result">Resultat</SelectItem>
                  <SelectItem value="assets">Eiendeler</SelectItem>
                  <SelectItem value="equity">Egenkapital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showTrend"
                checked={config.showTrend !== false}
                onChange={(e) => updateConfig('showTrend', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showTrend">Vis trend</Label>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="maxRows">Maksimalt antall rader</Label>
              <Input
                id="maxRows"
                type="number"
                value={config.maxRows || 10}
                onChange={(e) => updateConfig('maxRows', parseInt(e.target.value))}
                min="1"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="sortBy">Sorter etter</Label>
              <Select 
                value={config.sortBy || 'balance'} 
                onValueChange={(value) => updateConfig('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Saldo</SelectItem>
                  <SelectItem value="name">Kontonavn</SelectItem>
                  <SelectItem value="number">Kontonummer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPercentage"
                checked={config.showPercentage !== false}
                onChange={(e) => updateConfig('showPercentage', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showPercentage">Vis prosent</Label>
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="chartType">Diagramtype</Label>
              <Select 
                value={config.chartType || 'bar'} 
                onValueChange={(value) => updateConfig('chartType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Søylediagram</SelectItem>
                  <SelectItem value="line">Linjediagram</SelectItem>
                  <SelectItem value="pie">Sektordiagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxDataPoints">Maksimalt antall datapunkter</Label>
              <Input
                id="maxDataPoints"
                type="number"
                value={config.maxDataPoints || 6}
                onChange={(e) => updateConfig('maxDataPoints', parseInt(e.target.value))}
                min="3"
                max="20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showValues"
                checked={config.showValues !== false}
                onChange={(e) => updateConfig('showValues', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showValues">Vis verdier</Label>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Innhold</Label>
              <Textarea
                id="content"
                value={config.content || ''}
                onChange={(e) => updateConfig('content', e.target.value)}
                placeholder="Skriv inn tekst..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="fontSize">Skriftstørrelse</Label>
              <Select 
                value={config.fontSize || 'sm'} 
                onValueChange={(value) => updateConfig('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xs">Ekstra liten</SelectItem>
                  <SelectItem value="sm">Liten</SelectItem>
                  <SelectItem value="base">Normal</SelectItem>
                  <SelectItem value="lg">Stor</SelectItem>
                  <SelectItem value="xl">Ekstra stor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'formula':
        return (
          <FormulaWidgetConfig
            widget={widget}
            onUpdateWidget={onUpdateWidget}
            standardAccounts={standardAccounts}
          />
        );

      default:
        return null;
    }
  };

  // For formula widgets, use custom dialog sizing
  const dialogClassName = widget.type === 'formula' ? "sm:max-w-[800px] max-h-[90vh] overflow-y-auto" : "sm:max-w-[425px]";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className={dialogClassName}>
        <DialogHeader>
          <DialogTitle>Konfigurer widget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {widget.type !== 'formula' && (
            <div>
              <Label htmlFor="title">Tittel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Widget tittel"
              />
            </div>
          )}
          {renderTypeSpecificConfig()}
        </div>
        {widget.type !== 'formula' && (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Lagre
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}