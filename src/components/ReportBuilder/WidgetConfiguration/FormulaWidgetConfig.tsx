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
import { Calculator, TrendingUp } from 'lucide-react';
import { useFormulaDefinitions } from '@/hooks/useFormulas';
import { EnhancedFormulaBuilder, FormulaData } from '@/components/Admin/forms/EnhancedFormulaBuilder';

interface FormulaWidgetConfigProps {
  widget: Widget;
  onUpdateWidget: (updates: Partial<Widget>) => void;
  standardAccounts: Array<{ standard_number: string; standard_name: string }>;
}

// Standard formulas for quick setup
const standardFormulas = [
  {
    id: 'gross_margin',
    name: 'Bruttofortjenestegrad',
    description: 'Bruttofortjeneste i prosent av omsetning',
    category: 'Lønnsomhet',
    formula: {
      type: 'formula' as const,
      terms: [
        { id: '1', type: 'account' as const, account: '3000' },
        { id: '2', type: 'account' as const, account: '4000', operator: '+' as const },
        { id: '3', type: 'parenthesis' as const, parenthesis: 'close' as const, operator: '/' as const },
        { id: '4', type: 'account' as const, account: '3000' },
        { id: '5', type: 'constant' as const, constant: 100, operator: '*' as const }
      ],
      metadata: { description: 'Bruttofortjenestegrad beregning', category: 'profitability' }
    },
    displayAsPercentage: true
  },
  {
    id: 'current_ratio',
    name: 'Likviditetsgrad 1',
    description: 'Omløpsmidler / kortsiktig gjeld',
    category: 'Likviditet',
    formula: {
      type: 'formula' as const,
      terms: [
        { id: '1', type: 'account' as const, account: '1500' },
        { id: '2', type: 'account' as const, account: '2500', operator: '/' as const }
      ],
      metadata: { description: 'Likviditetsgrad 1 beregning', category: 'liquidity' }
    },
    displayAsPercentage: false
  },
  {
    id: 'equity_ratio',
    name: 'Egenkapitalandel',
    description: 'Egenkapital i prosent av totalkapital',
    category: 'Soliditet',
    formula: {
      type: 'formula' as const,
      terms: [
        { id: '1', type: 'account' as const, account: '2000' },
        { id: '2', type: 'account' as const, account: '1000', operator: '/' as const },
        { id: '3', type: 'constant' as const, constant: 100, operator: '*' as const }
      ],
      metadata: { description: 'Egenkapitalandel beregning', category: 'solvency' }
    },
    displayAsPercentage: true
  }
];

export function FormulaWidgetConfig({ widget, onUpdateWidget, standardAccounts }: FormulaWidgetConfigProps) {
  const [activeTab, setActiveTab] = useState('formula');
  const { data: formulaDefinitions } = useFormulaDefinitions();

  const handleFormulaChange = (formula: FormulaData | null) => {
    onUpdateWidget({
      config: {
        ...widget.config,
        customFormula: formula,
        formulaId: null // Clear formula ID when using custom formula
      }
    });
  };

  const handleStandardFormulaSelect = (standardFormulaId: string) => {
    const standardFormula = standardFormulas.find(f => f.id === standardFormulaId);
    if (standardFormula) {
      onUpdateWidget({
        title: standardFormula.name,
        config: {
          ...widget.config,
          customFormula: standardFormula.formula,
          formulaId: null,
          displayAsPercentage: standardFormula.displayAsPercentage,
          showCurrency: !standardFormula.displayAsPercentage
        }
      });
    }
  };

  const handleDatabaseFormulaSelect = (formulaId: string) => {
    onUpdateWidget({
      config: {
        ...widget.config,
        formulaId: formulaId,
        customFormula: null // Clear custom formula when using database formula
      }
    });
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="formula">Formel</TabsTrigger>
          <TabsTrigger value="standard">Standard</TabsTrigger>
          <TabsTrigger value="display">Visning</TabsTrigger>
        </TabsList>

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
            </CardContent>
          </Card>

          {formulaDefinitions && formulaDefinitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lagrede formler</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={widget.config?.formulaId || ''}
                  onValueChange={handleDatabaseFormulaSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg en lagret formel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {formulaDefinitions.map((formula) => (
                      <SelectItem key={formula.id} value={formula.id}>
                        <div className="flex items-center gap-2">
                          <span>{formula.name}</span>
                          {formula.category && (
                            <Badge variant="secondary" className="text-xs">
                              {formula.category}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="standard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Standard nøkkeltall</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {standardFormulas.map((formula) => (
                  <div
                    key={formula.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleStandardFormulaSelect(formula.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{formula.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {formula.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formula.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Bruk
                    </Button>
                  </div>
                ))}
              </div>
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
    </div>
  );
}