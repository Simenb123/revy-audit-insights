import React, { useState } from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { FormulaWidgetConfig } from './WidgetConfiguration/FormulaWidgetConfig';
import { useFirmStandardAccounts } from '@/hooks/useFirmStandardAccounts';
import { useFormulaDefinitions } from '@/hooks/useFormulas';

interface WidgetConfigurationProps {
  widget: Widget;
  onUpdateWidget: (updates: Partial<Widget>) => void;
}

export function WidgetConfiguration({ widget, onUpdateWidget }: WidgetConfigurationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(widget.title);
  const [config, setConfig] = useState(widget.config || {});
const { data: standardAccounts = [] } = useFirmStandardAccounts();
  const { data: formulas = [] } = useFormulaDefinitions();

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
      case 'filter':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-search">Vis søkefelt</Label>
              <Switch
                id="show-search"
                checked={config.showSearch !== false}
                onCheckedChange={(checked) => updateConfig('showSearch', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-category">Vis kontokategori-filter</Label>
              <Switch
                id="show-category"
                checked={config.showAccountCategory !== false}
                onCheckedChange={(checked) => updateConfig('showAccountCategory', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-type">Vis kontotype-filter</Label>
              <Switch
                id="show-type"
                checked={config.showAccountType !== false}
                onCheckedChange={(checked) => updateConfig('showAccountType', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-date">Vis datofilter</Label>
              <Switch
                id="show-date"
                checked={config.showDateRange !== false}
                onCheckedChange={(checked) => updateConfig('showDateRange', checked)}
              />
            </div>
          </div>
        );

      case 'kpi':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="sourceType">Kildetype</Label>
              <Select
                value={config.sourceType || 'alias'}
                onValueChange={(value) => updateConfig('sourceType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alias">Forhåndsdefinert nøkkeltall</SelectItem>
                  <SelectItem value="formula">Lagret formel</SelectItem>
                  <SelectItem value="expr">Egendefinert uttrykk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(!config.sourceType || config.sourceType === 'alias') && (
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
                    <SelectItem value="profit">Resultat</SelectItem>
                    <SelectItem value="assets">Eiendeler</SelectItem>
                    <SelectItem value="equity">Egenkapital</SelectItem>
                    <SelectItem value="equity_ratio">Egenkapitalandel</SelectItem>
                    <SelectItem value="liquidity_ratio">Likviditetsgrad</SelectItem>
                    <SelectItem value="profit_margin">Fortjenestemargin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.sourceType === 'formula' && (
              <div>
                <Label htmlFor="formulaId">Lagret formel</Label>
                <Select
                  value={config.formulaId || ''}
                  onValueChange={(value) => updateConfig('formulaId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formulas.length ? 'Velg formel' : 'Ingen lagrede formler'} />
                  </SelectTrigger>
                  <SelectContent>
                    {formulas.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.sourceType === 'expr' && (
              <div>
                <Label htmlFor="customFormula">Uttrykk (bruk [NN] eller [A-B], f.eks. [19-79])</Label>
                <Textarea
                  id="customFormula"
                  value={config.customFormula || ''}
                  onChange={(e) => updateConfig('customFormula', e.target.value)}
                  placeholder="[19-79]"
                  rows={3}
                />
              </div>
            )}

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

            <div>
              <Label htmlFor="unitScale">Enhetsskala</Label>
              <Select
                value={config.unitScale || 'none'}
                onValueChange={(value) => updateConfig('unitScale', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen</SelectItem>
                  <SelectItem value="thousand">Tusen</SelectItem>
                  <SelectItem value="million">Millioner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="displayAsPercentage"
                checked={config.displayAsPercentage || false}
                onChange={(e) => updateConfig('displayAsPercentage', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="displayAsPercentage">Vis som prosent</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showCurrency"
                checked={(config.showCurrency !== false) && !config.displayAsPercentage}
                onChange={(e) => updateConfig('showCurrency', e.target.checked)}
                className="rounded"
                disabled={config.displayAsPercentage}
              />
              <Label htmlFor="showCurrency">Vis valuta</Label>
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableTableCrossFilter"
                checked={config.enableCrossFilter !== false}
                onChange={(e) => updateConfig('enableCrossFilter', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="enableTableCrossFilter">Aktiver kryssfiltrering</Label>
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
              <Label htmlFor="dataSource">Datakilde</Label>
              <Select 
                value={config.chartDataSource || 'breakdown'} 
                onValueChange={(value) => updateConfig('chartDataSource', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakdown">Saldobalanse-kategorier (inneværende år)</SelectItem>
                  <SelectItem value="formulaSeries">Tidsserie av formel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.chartDataSource === 'formulaSeries' && (
              <div className="space-y-4">
                <div>
                  <Label>Kildetype</Label>
                  <Select
                    value={config.sourceType || 'alias'}
                    onValueChange={(value) => updateConfig('sourceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alias">Forhåndsdefinert nøkkeltall</SelectItem>
                      <SelectItem value="formula">Lagret formel</SelectItem>
                      <SelectItem value="expr">Egendefinert uttrykk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(!config.sourceType || config.sourceType === 'alias') && (
                  <div>
                    <Label>Nøkkeltall</Label>
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
                        <SelectItem value="profit">Resultat</SelectItem>
                        <SelectItem value="assets">Eiendeler</SelectItem>
                        <SelectItem value="equity">Egenkapital</SelectItem>
                        <SelectItem value="equity_ratio">Egenkapitalandel</SelectItem>
                        <SelectItem value="liquidity_ratio">Likviditetsgrad</SelectItem>
                        <SelectItem value="profit_margin">Fortjenestemargin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {config.sourceType === 'formula' && (
                  <div>
                    <Label>Lagret formel</Label>
                    <Select
                      value={config.formulaId || ''}
                      onValueChange={(value) => updateConfig('formulaId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formulas.length ? 'Velg formel' : 'Ingen lagrede formler'} />
                      </SelectTrigger>
                      <SelectContent>
                        {formulas.map((f: any) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {config.sourceType === 'expr' && (
                  <div>
                    <Label>Egendefinert uttrykk (bruk [NN] eller [A-B], f.eks. [19-79])</Label>
                    <Textarea
                      value={config.customFormula || ''}
                      onChange={(e) => updateConfig('customFormula', e.target.value)}
                      placeholder="[19-79]"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="yearsBack">Antall år</Label>
                  <Input
                    id="yearsBack"
                    type="number"
                    value={config.yearsBack || 5}
                    onChange={(e) => updateConfig('yearsBack', Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="15"
                  />
                </div>

                <div>
                  <Label htmlFor="unitScaleChart">Enhetsskala</Label>
                  <Select
                    value={config.unitScale || 'none'}
                    onValueChange={(value) => updateConfig('unitScale', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ingen</SelectItem>
                      <SelectItem value="thousand">Tusen</SelectItem>
                      <SelectItem value="million">Millioner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-muted-foreground">Tips: For tidsserier anbefales linjediagram.</div>
              </div>
            )}

            <div>
              <Label htmlFor="maxDataPoints">Maksimalt antall datapunkter</Label>
              <Input
                id="maxDataPoints"
                type="number"
                value={config.maxDataPoints || 6}
                onChange={(e) => updateConfig('maxDataPoints', parseInt(e.target.value))}
                min="3"
                max="20"
                disabled={config.chartDataSource === 'formulaSeries'}
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableCrossFilter"
                checked={config.enableCrossFilter !== false}
                onChange={(e) => updateConfig('enableCrossFilter', e.target.checked)}
                className="rounded"
                disabled={config.chartDataSource === 'formulaSeries'}
              />
              <Label htmlFor="enableCrossFilter">Aktiver kryssfiltrering</Label>
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

      case 'accountLines':
        return (
          <div className="space-y-4">
            <div>
              <Label>Legg til regnskapslinje</Label>
              <div className="flex gap-2 items-center mt-1">
                <Select onValueChange={(value) => {
                  const arr = Array.isArray(config.accountLines) ? config.accountLines : [];
                  if (!arr.includes(value)) updateConfig('accountLines', [...arr, value]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg linje (standardnr)" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardAccounts.map((acc: any) => (
                      <SelectItem key={acc.standard_number} value={String(acc.standard_number)}>
                        {acc.standard_number} - {acc.standard_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(Array.isArray(config.accountLines) && config.accountLines.length > 0) && (
                <div className="mt-2 space-y-1">
                  {config.accountLines.map((num: string, idx: number) => (
                    <div key={`${num}-${idx}`} className="flex items-center justify-between text-xs">
                      <span>
                        {num} - {standardAccounts.find((a: any) => String(a.standard_number) === String(num))?.standard_name || ''}
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 px-2"
                        onClick={() => updateConfig('accountLines', config.accountLines.filter((n: string) => n !== num))}>
                        Fjern
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Legg til intervall (A-B)</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input placeholder="Fra" className="w-20" id="intervalFrom" />
                <Input placeholder="Til" className="w-20" id="intervalTo" />
                <Button
                  type="button"
                  onClick={() => {
                    const from = (document.getElementById('intervalFrom') as HTMLInputElement)?.value?.trim();
                    const to = (document.getElementById('intervalTo') as HTMLInputElement)?.value?.trim();
                    if (!from || !to) return;
                    const interval = `${from}-${to}`;
                    const arr = Array.isArray(config.accountIntervals) ? config.accountIntervals : [];
                    if (!arr.includes(interval)) updateConfig('accountIntervals', [...arr, interval]);
                    (document.getElementById('intervalFrom') as HTMLInputElement).value = '';
                    (document.getElementById('intervalTo') as HTMLInputElement).value = '';
                  }}
                >
                  Legg til
                </Button>
              </div>
              {(Array.isArray(config.accountIntervals) && config.accountIntervals.length > 0) && (
                <div className="mt-2 space-y-1">
                  {config.accountIntervals.map((iv: string, idx: number) => (
                    <div key={`${iv}-${idx}`} className="flex items-center justify-between text-xs">
                      <span>[{iv}]</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2"
                        onClick={() => updateConfig('accountIntervals', config.accountIntervals.filter((v: string) => v !== iv))}>
                        Fjern
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Enhetsskala</Label>
              <Select value={config.unitScale || 'none'} onValueChange={(value) => updateConfig('unitScale', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen</SelectItem>
                  <SelectItem value="thousand">Tusen</SelectItem>
                  <SelectItem value="million">Millioner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showYoY">Vis endring YoY</Label>
              <Switch id="showYoY" checked={config.showYoY !== false} onCheckedChange={(checked) => updateConfig('showYoY', checked)} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showCurrency">Vis valuta</Label>
              <Switch id="showCurrency" checked={config.showCurrency !== false} onCheckedChange={(checked) => updateConfig('showCurrency', checked)} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showShareOf">Vis andel av base</Label>
              <Switch id="showShareOf" checked={!!config.showShareOf} onCheckedChange={(checked) => updateConfig('showShareOf', checked)} />
            </div>

            {config.showShareOf && (
              <div>
                <Label htmlFor="shareBaseExpr">Base-uttrykk (f.eks. [10])</Label>
                <Input id="shareBaseExpr" value={config.shareBaseExpr || '[10]'} onChange={(e) => updateConfig('shareBaseExpr', e.target.value)} placeholder="[10]" />
              </div>
            )}
          </div>
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
          onMouseDown={e => e.stopPropagation()}
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