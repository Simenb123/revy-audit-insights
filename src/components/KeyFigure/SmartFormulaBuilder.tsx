import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Calculator,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useFormulaSuggestions, FormulaSuggestion } from '@/hooks/useFormulaSuggestions';
import { DragDropFormulaBuilder } from './DragDropFormulaBuilder';
import { FormulaSuggestions } from './FormulaSuggestions';
import { FormulaValidatorComponent } from './FormulaValidatorComponent';
import { VisualFormulaTester } from './VisualFormulaTester';

interface SmartFormulaBuilderProps {
  clientId?: string;
  availableAccounts?: Array<{ code: string; name: string }>;
  onFormulaComplete?: (formula: { 
    name: string; 
    description: string; 
    formula: string; 
    category: string;
  }) => void;
  className?: string;
}

const formulaCategories = [
  { 
    value: 'profitability', 
    label: 'Lønnsomhet', 
    icon: TrendingUp,
    description: 'Måler hvor lønnsom virksomheten er'
  },
  { 
    value: 'liquidity', 
    label: 'Likviditet', 
    icon: Activity,
    description: 'Måler betalingsevne på kort sikt'
  },
  { 
    value: 'efficiency', 
    label: 'Effektivitet', 
    icon: Zap,
    description: 'Måler hvor effektivt ressursene brukes'
  },
  { 
    value: 'leverage', 
    label: 'Soliditet', 
    icon: BarChart3,
    description: 'Måler gjeldsgrad og finansiell stabilitet'
  },
  { 
    value: 'growth', 
    label: 'Vekst', 
    icon: Target,
    description: 'Måler vekst og utvikling over tid'
  }
];

const predefinedFormulas = {
  profitability: [
    { name: 'Bruttomargin %', formula: '(3020 - 4000) / 3020 * 100', description: 'Inntekt minus varekostnad i prosent av inntekt' },
    { name: 'Driftsmargin %', formula: '3050 / 3020 * 100', description: 'Driftsresultat i prosent av inntekt' },
    { name: 'Totalrentabilitet %', formula: '3050 / (1000 + 2000) * 100', description: 'Driftsresultat i prosent av totalkapital' }
  ],
  liquidity: [
    { name: 'Likviditetsgrad 1', formula: '1900 / 2400', description: 'Omløpsmidler delt på kortsiktig gjeld' },
    { name: 'Likviditetsgrad 2', formula: '(1900 - 1400) / 2400', description: 'Omløpsmidler minus varer delt på kortsiktig gjeld' },
    { name: 'Kontantgrad', formula: '1900 / 2400', description: 'Kontanter og tilsvarende delt på kortsiktig gjeld' }
  ],
  efficiency: [
    { name: 'Lageromløpshastighet', formula: '4000 / 1400', description: 'Varekostnad delt på gjennomsnittlig lagerbeholdning' },
    { name: 'Kundefordringer omløp', formula: '3020 / 1500', description: 'Omsetning delt på gjennomsnittlige kundefordringer' },
    { name: 'Kapitalomløpshastighet', formula: '3020 / (1000 + 2000)', description: 'Omsetning delt på totalkapital' }
  ],
  leverage: [
    { name: 'Egenkapitalandel %', formula: '2000 / (1000 + 2000) * 100', description: 'Egenkapital i prosent av totalkapital' },
    { name: 'Gjeldsgrad', formula: '2400 / 2000', description: 'Total gjeld delt på egenkapital' },
    { name: 'Rentedekningsgrad', formula: '3050 / 8050', description: 'Driftsresultat delt på rentekostnader' }
  ],
  growth: [
    { name: 'Omsetningsvekst %', formula: '(3020_ny - 3020_gammel) / 3020_gammel * 100', description: 'Prosentvis endring i omsetning' },
    { name: 'Resultatvekst %', formula: '(3050_ny - 3050_gammel) / 3050_gammel * 100', description: 'Prosentvis endring i driftsresultat' }
  ]
};

export function SmartFormulaBuilder({
  clientId,
  availableAccounts = [],
  onFormulaComplete,
  className
}: SmartFormulaBuilderProps) {
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentFormula, setCurrentFormula] = useState('');
  const [formulaName, setFormulaName] = useState('');
  const [formulaDescription, setFormulaDescription] = useState('');
  const [builderMode, setBuilderMode] = useState<'drag-drop' | 'suggestions' | 'templates'>('drag-drop');
  
  const { generateSuggestions, suggestions, isGenerating } = useFormulaSuggestions();

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (clientId) {
      generateSuggestions({
        clientId,
        industry: 'general',
        companySize: 'medium',
        analysisType: 'basic'
      });
    }
  };

  const handleTemplateSelect = (template: any) => {
    setCurrentFormula(template.formula);
    setFormulaName(template.name);
    setFormulaDescription(template.description);
    setSelectedCategory(getCurrentCategory());
  };

  const getCurrentCategory = () => {
    // Logic to determine category based on formula content
    if (currentFormula.includes('3020') && currentFormula.includes('4000')) return 'profitability';
    if (currentFormula.includes('1900') && currentFormula.includes('2400')) return 'liquidity';
    return 'efficiency';
  };

  const handleSaveFormula = () => {
    if (currentFormula && formulaName) {
      onFormulaComplete?.({
        name: formulaName,
        description: formulaDescription,
        formula: currentFormula,
        category: selectedCategory || getCurrentCategory()
      });
      
      // Reset form
      setCurrentFormula('');
      setFormulaName('');
      setFormulaDescription('');
      setSelectedCategory('');
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = formulaCategories.find(c => c.value === category);
    return cat ? cat.icon : Calculator;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart Formel-bygger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="builder" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Bygger
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Maler
              </TabsTrigger>
              <TabsTrigger value="ai-suggestions" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI-forslag
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Test
              </TabsTrigger>
            </TabsList>

            {/* Formula Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="formula-name">Navn på nøkkeltall</Label>
                <Input
                  id="formula-name"
                  placeholder="F.eks. Likviditetsgrad 1"
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formula-category">Kategori</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {formulaCategories.map(category => {
                      const IconComponent = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="formula-description">Beskrivelse</Label>
                <Input
                  id="formula-description"
                  placeholder="Kort beskrivelse av nøkkeltallet"
                  value={formulaDescription}
                  onChange={(e) => setFormulaDescription(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="builder" className="space-y-6">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={builderMode === 'drag-drop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBuilderMode('drag-drop')}
                >
                  Dra & slipp
                </Button>
                <Button
                  variant={builderMode === 'suggestions' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBuilderMode('suggestions')}
                >
                  AI-forslag
                </Button>
              </div>

              {builderMode === 'drag-drop' ? (
                <DragDropFormulaBuilder
                  formula={currentFormula}
                  onFormulaChange={setCurrentFormula}
                  availableAccounts={availableAccounts}
                />
              ) : (
                <FormulaSuggestions
                  clientId={clientId}
                  onSelectSuggestion={(suggestion: FormulaSuggestion) => {
                    setCurrentFormula(suggestion.formula);
                    setFormulaName(suggestion.name);
                    setFormulaDescription(suggestion.description);
                    setSelectedCategory(suggestion.category);
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formulaCategories.map(category => {
                  const IconComponent = category.icon;
                  const templates = predefinedFormulas[category.value as keyof typeof predefinedFormulas] || [];
                  
                  return (
                    <Card key={category.value} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader 
                        className="pb-3"
                        onClick={() => handleCategorySelect(category.value)}
                      >
                        <CardTitle className="text-base flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {category.label}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {templates.map((template, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <div className="space-y-1">
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground">{template.description}</div>
                              <code className="text-xs font-mono bg-muted px-1 rounded">
                                {template.formula}
                              </code>
                            </div>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="ai-suggestions" className="space-y-6">
              <FormulaSuggestions
                clientId={clientId}
                onSelectSuggestion={(suggestion: FormulaSuggestion) => {
                  setCurrentFormula(suggestion.formula);
                  setFormulaName(suggestion.name);
                  setFormulaDescription(suggestion.description);
                  setSelectedCategory(suggestion.category);
                }}
              />
            </TabsContent>

            <TabsContent value="test" className="space-y-6">
              {currentFormula ? (
                <>
                  <FormulaValidatorComponent
                    formula={currentFormula}
                    allowedAccounts={availableAccounts.map(acc => acc.code)}
                  />
                  <VisualFormulaTester
                    formulaExpression={currentFormula}
                    clientId={clientId}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Bygg en formel først for å teste den
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button
              onClick={handleSaveFormula}
              disabled={!currentFormula || !formulaName}
              className="flex items-center gap-2"
            >
              <PieChart className="h-4 w-4" />
              Lagre nøkkeltall
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}