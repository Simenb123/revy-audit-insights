import React, { useState } from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Save, Library } from 'lucide-react';
import { useFormulaDefinitions } from '@/hooks/useFormulas';
import { EnhancedFormulaBuilder, FormulaData } from '@/components/Admin/forms/EnhancedFormulaBuilder';
import { SaveFormulaDialog } from './SaveFormulaDialog';

interface FormulaWidgetConfigProps {
  widget: Widget;
  onUpdateWidget: (updates: Partial<Widget>) => void;
  standardAccounts: Array<{ standard_number: string; standard_name: string }>;
}

// These are now managed in the database via formula_definitions
// Keep only a few basic quick-start options for backward compatibility

export function FormulaWidgetConfig({ widget, onUpdateWidget, standardAccounts }: FormulaWidgetConfigProps) {
  const [activeTab, setActiveTab] = useState('predefined');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { data: formulaDefinitions, refetch } = useFormulaDefinitions();

  const handleFormulaChange = (formula: FormulaData | null) => {
    onUpdateWidget({
      config: {
        ...widget.config,
        customFormula: formula,
        formulaId: null // Clear formula ID when using custom formula
      }
    });
  };

  const handlePredefinedFormulaSelect = (formulaId: string) => {
    const predefinedFormula = formulaDefinitions?.find(f => f.id === formulaId);
    if (predefinedFormula) {
      onUpdateWidget({
        title: predefinedFormula.name,
        config: {
          ...widget.config,
          formulaId: formulaId,
          customFormula: null // Clear custom formula when using database formula
        }
      });
    }
  };

  const handleDatabaseFormulaSelect = (formulaId: string) => {
    // This is now handled by the predefined formulas tab
    handlePredefinedFormulaSelect(formulaId);
  };

  const handleSaveFormula = () => {
    if (widget.config?.customFormula) {
      setShowSaveDialog(true);
    }
  };

  const handleFormulaSaved = (savedFormulaId: string) => {
    // Automatically select the newly saved formula
    onUpdateWidget({
      config: {
        ...widget.config,
        formulaId: savedFormulaId,
        customFormula: null // Clear custom formula since we now have a saved one
      }
    });
    refetch(); // Refresh the formula definitions list
  };

  // KPI support is now integrated into the predefined formulas system

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="widget-title">Widget-tittel</Label>
        <Input
          id="widget-title"
          value={widget.title}
          onChange={(e) => onUpdateWidget({ title: e.target.value })}
          placeholder="Skriv inn widget-tittel..."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regnskapslinje (valgfritt)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="std-line">Standardnr</Label>
              <Input
                id="std-line"
                value={(typeof widget.config?.customFormula === 'string' && /^\[(\d+)\]$/.test(widget.config?.customFormula)) ? (widget.config?.customFormula.match(/^\[(\d+)\]$/)?.[1] || '') : ''}
                onChange={(e) => {
                  const raw = e.target.value || '';
                  const v = raw.replace(/[^0-9-]/g, '');
                  const expr = v ? `[${v}]` : '';
                  onUpdateWidget({
                    config: {
                      ...widget.config,
                      sourceType: 'expr',
                      customFormula: expr,
                      formulaId: null
                    }
                  });
                }}
                placeholder="10 for Salgsinntekter (eller 19-79 for intervall)"
              />
              <div className="text-xs text-muted-foreground mt-2">Bruker [NN]-syntaks, f.eks. [10] eller [19-79].</div>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                onUpdateWidget({
                  config: { ...widget.config, customFormula: null }
                })
              }
            >Fjern</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predefined">Predefinerte</TabsTrigger>
          <TabsTrigger value="formula">Egendefinert</TabsTrigger>
          <TabsTrigger value="display">Visning</TabsTrigger>
        </TabsList>

        <TabsContent value="predefined" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Library className="h-5 w-5" />
                Predefinerte formler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formulaDefinitions && formulaDefinitions.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {formulaDefinitions.map((formula) => (
                    <div
                      key={formula.id}
                      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                        widget.config?.formulaId === formula.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handlePredefinedFormulaSelect(formula.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{formula.name}</h4>
                          {formula.category && (
                            <Badge variant="outline" className="text-xs">
                              {formula.category}
                            </Badge>
                          )}
                          {widget.config?.formulaId === formula.id && (
                            <Badge variant="default" className="text-xs">
                              Aktiv
                            </Badge>
                          )}
                        </div>
                        {formula.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formula.description}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant={widget.config?.formulaId === formula.id ? "default" : "outline"} 
                        size="sm"
                      >
                        {widget.config?.formulaId === formula.id ? 'Valgt' : 'Velg'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">
                  Ingen predefinerte formler tilgjengelig. Lag egendefinerte formler i neste fane.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formula" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Formelkonfigurasjon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedFormulaBuilder
                value={widget.config?.customFormula}
                onChange={handleFormulaChange}
                standardAccounts={standardAccounts}
              />
              
              {widget.config?.customFormula && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Bygg egen formel eller velg en lagret formel nedenfor
                  </div>
                  <Button 
                    onClick={handleSaveFormula}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Lagre formel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Visningsinnstillinger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-trend">Vis trend</Label>
                  <div className="text-sm text-muted-foreground">
                    Viser pil og prosentvis endring
                  </div>
                </div>
                <Switch
                  id="show-trend"
                  checked={widget.config?.showTrend !== false}
                  onCheckedChange={(checked) =>
                    onUpdateWidget({
                      config: { ...widget.config, showTrend: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="display-percentage">Vis som prosent</Label>
                  <div className="text-sm text-muted-foreground">
                    Legger til %-symbol og formaterer som prosent
                  </div>
                </div>
                <Switch
                  id="display-percentage"
                  checked={widget.config?.displayAsPercentage || false}
                  onCheckedChange={(checked) =>
                    onUpdateWidget({
                      config: { 
                        ...widget.config, 
                        displayAsPercentage: checked,
                        showCurrency: !checked // Auto-disable currency when percentage is enabled
                      }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-currency">Vis valuta</Label>
                  <div className="text-sm text-muted-foreground">
                    Viser kr-symbol og formaterer tall
                  </div>
                </div>
                <Switch
                  id="show-currency"
                  checked={widget.config?.showCurrency !== false && !widget.config?.displayAsPercentage}
                  onCheckedChange={(checked) =>
                    onUpdateWidget({
                      config: { ...widget.config, showCurrency: checked }
                    })
                  }
                  disabled={widget.config?.displayAsPercentage}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <SaveFormulaDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        formula={widget.config?.customFormula}
        onSave={handleFormulaSaved}
      />
    </div>
  );
}