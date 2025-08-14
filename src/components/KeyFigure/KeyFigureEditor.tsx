import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  X, 
  Calculator, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Minus,
  DivideIcon,
  Asterisk,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateFormulaDefinition, useUpdateFormulaDefinition, type FormulaDefinition } from '@/hooks/useFormulas';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';

interface KeyFigureEditorProps {
  formula?: FormulaDefinition;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormulaExpression {
  type: 'calculation' | 'hardcoded' | 'comparison';
  expression: string;
  resultType: 'percentage' | 'ratio' | 'amount' | 'currency';
  name?: string; // For hardcoded formulas
}

interface Benchmark {
  poor: number;
  fair: number;
  good: number;
  excellent: number;
}

const CATEGORIES = [
  { value: 'profitability', label: 'Lønnsomhet' },
  { value: 'liquidity', label: 'Likviditet' },
  { value: 'solvency', label: 'Soliditet' },
  { value: 'efficiency', label: 'Effektivitet' },
  { value: 'growth', label: 'Vekst' },
  { value: 'custom', label: 'Egendefinert' }
];

const RESULT_TYPES = [
  { value: 'percentage', label: 'Prosent (%)' },
  { value: 'ratio', label: 'Forholdstall' },
  { value: 'amount', label: 'Beløp' },
  { value: 'currency', label: 'Valuta (kr)' }
];

const OPERATORS = [
  { symbol: '+', label: 'Addisjon', icon: Plus },
  { symbol: '-', label: 'Subtraksjon', icon: Minus },
  { symbol: '*', label: 'Multiplikasjon', icon: Asterisk },
  { symbol: '/', label: 'Divisjon', icon: DivideIcon }
];

const STANDARD_ACCOUNTS = [
  { range: '[10-15]', name: 'Omsetning', description: 'Salgsinntekter og andre driftsinntekter' },
  { range: '[19]', name: 'Sum driftsinntekter', description: 'Totale driftsinntekter' },
  { range: '[20-70]', name: 'Driftskostnader', description: 'Alle driftsrelaterte kostnader' },
  { range: '[29]', name: 'Driftsresultat', description: 'Resultat fra hovedvirksomhet' },
  { range: '[79]', name: 'Ordinært resultat', description: 'Resultat før skatt' },
  { range: '[500-599]', name: 'Anleggsmidler', description: 'Varige driftsmidler og andre anleggsmidler' },
  { range: '[600-699]', name: 'Omløpsmidler', description: 'Kortsiktige eiendeler' },
  { range: '[605-655]', name: 'Omløpsmidler (detaljert)', description: 'Varelager, fordringer og kontanter' },
  { range: '[610-615]', name: 'Varelager', description: 'Råvarer, halvfabrikata og ferdigvarer' },
  { range: '[618]', name: 'Kundefordringer', description: 'Utestående fordringer på kunder' },
  { range: '[655]', name: 'Kontanter', description: 'Bank og kontantbeholdning' },
  { range: '[670-705]', name: 'Egenkapital', description: 'Eiers kapital i selskapet' },
  { range: '[710-899]', name: 'Total gjeld', description: 'All gjeld, kortsiktig og langsiktig' },
  { range: '[780-799]', name: 'Kortsiktig gjeld', description: 'Gjeld som forfaller innen ett år' }
];

export default function KeyFigureEditor({ formula, isOpen, onClose, onSuccess }: KeyFigureEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    resultType: 'ratio',
    expression: '',
    interpretation: '',
    displayAsPercentage: false,
    benchmarks: {
      poor: 0,
      fair: 0,
      good: 0,
      excellent: 0
    }
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [testClientId, setTestClientId] = useState('');
  const [testYear, setTestYear] = useState(new Date().getFullYear());
  const [isValidExpression, setIsValidExpression] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');

  const { toast } = useToast();
  const createFormula = useCreateFormulaDefinition();
  const updateFormula = useUpdateFormulaDefinition();

  const { data: testResult, isLoading: isTestingFormula } = useFormulaCalculation({
    clientId: testClientId,
    fiscalYear: testYear,
    customFormula: formData.expression,
    enabled: Boolean(testClientId && formData.expression && isValidExpression)
  });

  useEffect(() => {
    if (formula) {
      try {
        const expression = typeof formula.formula_expression === 'string' 
          ? JSON.parse(formula.formula_expression) 
          : formula.formula_expression;
        
        const metadata = typeof formula.metadata === 'string'
          ? JSON.parse(formula.metadata)
          : formula.metadata || {};

        setFormData({
          name: formula.name,
          description: formula.description || '',
          category: formula.category || 'custom',
          resultType: expression?.resultType || 'ratio',
          expression: expression?.expression || '',
          interpretation: metadata?.interpretation || '',
          displayAsPercentage: metadata?.displayAsPercentage || false,
          benchmarks: metadata?.benchmarks || { poor: 0, fair: 0, good: 0, excellent: 0 }
        });
      } catch (error) {
        console.error('Error parsing formula data:', error);
      }
    } else {
      // Reset form for new formula
      setFormData({
        name: '',
        description: '',
        category: 'custom',
        resultType: 'ratio',
        expression: '',
        interpretation: '',
        displayAsPercentage: false,
        benchmarks: { poor: 0, fair: 0, good: 0, excellent: 0 }
      });
    }
  }, [formula, isOpen]);

  const validateExpression = (expr: string) => {
    if (!expr.trim()) {
      setIsValidExpression(false);
      setValidationMessage('Uttrykk kan ikke være tomt');
      return;
    }

    // Basic validation for mathematical expressions
    const validPattern = /^[\d\[\]\-\+\*\/\(\)\s\.]+$/;
    if (!validPattern.test(expr)) {
      setIsValidExpression(false);
      setValidationMessage('Uttrykk inneholder ugyldige tegn');
      return;
    }

    // Check for balanced parentheses
    let depth = 0;
    for (const char of expr) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) {
        setIsValidExpression(false);
        setValidationMessage('Ubalanserte parenteser');
        return;
      }
    }

    if (depth !== 0) {
      setIsValidExpression(false);
      setValidationMessage('Ubalanserte parenteser');
      return;
    }

    setIsValidExpression(true);
    setValidationMessage('');
  };

  useEffect(() => {
    validateExpression(formData.expression);
  }, [formData.expression]);

  const insertAccountRange = (range: string) => {
    setFormData(prev => ({
      ...prev,
      expression: prev.expression + range
    }));
  };

  const insertOperator = (operator: string) => {
    setFormData(prev => ({
      ...prev,
      expression: prev.expression + ` ${operator} `
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Feil",
        description: "Navn er påkrevd",
        variant: "destructive"
      });
      return;
    }

    if (!isValidExpression) {
      toast({
        title: "Feil",
        description: "Uttrykk er ikke gyldig",
        variant: "destructive"
      });
      return;
    }

    const formulaExpression: FormulaExpression = {
      type: 'calculation',
      expression: formData.expression,
      resultType: formData.resultType as any
    };

    const metadata = {
      category: formData.category,
      displayAsPercentage: formData.displayAsPercentage,
      interpretation: formData.interpretation,
      benchmarks: formData.benchmarks
    };

    const formulaData = {
      name: formData.name,
      description: formData.description,
      formula_expression: formulaExpression,
      category: formData.category,
      is_system_formula: false,
      version: 1,
      is_active: true,
      metadata
    };

    try {
      if (formula) {
        await updateFormula.mutateAsync({ 
          id: formula.id, 
          ...formulaData 
        });
        toast({
          title: "Formel oppdatert",
          description: `"${formData.name}" ble oppdatert.`
        });
      } else {
        await createFormula.mutateAsync(formulaData);
        toast({
          title: "Formel opprettet",
          description: `"${formData.name}" ble opprettet.`
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Feil ved lagring",
        description: error.message || "Kunne ikke lagre formelen",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {formula ? 'Rediger nøkkeltall' : 'Opprett nytt nøkkeltall'}
          </DialogTitle>
          <DialogDescription>
            {formula ? 'Oppdater nøkkeltallsformelen' : 'Lag en ny formel for beregning av nøkkeltall'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Grunnleggende</TabsTrigger>
            <TabsTrigger value="formula">Formel</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="preview">Forhåndsvisning</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="f.eks. Likviditetsgrad 1"
                />
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kort beskrivelse av hva nøkkeltallet måler"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resultType">Resultattype</Label>
                  <Select 
                    value={formData.resultType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, resultType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESULT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="interpretation">Tolkning</Label>
                <Textarea
                  id="interpretation"
                  value={formData.interpretation}
                  onChange={(e) => setFormData(prev => ({ ...prev, interpretation: e.target.value }))}
                  placeholder="Hvordan tolkes resultatet? Hva er bra/dårlige verdier?"
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formula" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="expression">Formeluttrykk *</Label>
                <div className="relative">
                  <Textarea
                    id="expression"
                    value={formData.expression}
                    onChange={(e) => setFormData(prev => ({ ...prev, expression: e.target.value }))}
                    placeholder="f.eks. [605-655] / [780-799]"
                    rows={3}
                    className={!isValidExpression ? 'border-destructive' : ''}
                  />
                  {!isValidExpression && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {validationMessage}
                    </div>
                  )}
                  {isValidExpression && formData.expression && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Gyldig uttrykk
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Kontogrupper</CardTitle>
                    <CardDescription className="text-xs">
                      Klikk for å legge til i formelen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {STANDARD_ACCOUNTS.map((account) => (
                        <div
                          key={account.range}
                          className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                          onClick={() => insertAccountRange(account.range)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm font-medium">
                              {account.range}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {account.name}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Operatorer</CardTitle>
                    <CardDescription className="text-xs">
                      Matematiske operasjoner
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {OPERATORS.map((op) => {
                        const Icon = op.icon;
                        return (
                          <Button
                            key={op.symbol}
                            variant="outline"
                            size="sm"
                            onClick={() => insertOperator(op.symbol)}
                            className="justify-start"
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {op.label}
                          </Button>
                        );
                      })}
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertOperator('(')}
                        className="w-full justify-start"
                      >
                        ( ) Parenteser
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertOperator('* 100')}
                        className="w-full justify-start"
                      >
                        × 100 (for prosent)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="benchmarks" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Benchmark-verdier</Label>
                <p className="text-sm text-muted-foreground">
                  Definer referanseverdier for tolkning av resultatet
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="poor">Dårlig</Label>
                  <Input
                    id="poor"
                    type="number"
                    step="0.1"
                    value={formData.benchmarks.poor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benchmarks: { ...prev.benchmarks, poor: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="fair">Akseptabel</Label>
                  <Input
                    id="fair"
                    type="number"
                    step="0.1"
                    value={formData.benchmarks.fair}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benchmarks: { ...prev.benchmarks, fair: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="good">God</Label>
                  <Input
                    id="good"
                    type="number"
                    step="0.1"
                    value={formData.benchmarks.good}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benchmarks: { ...prev.benchmarks, good: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="excellent">Utmerket</Label>
                  <Input
                    id="excellent"
                    type="number"
                    step="0.1"
                    value={formData.benchmarks.excellent}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benchmarks: { ...prev.benchmarks, excellent: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Visuell preview av benchmarks:</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    ≤ {formData.benchmarks.poor}
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    ≤ {formData.benchmarks.fair}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    ≤ {formData.benchmarks.good}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    ≤ {formData.benchmarks.excellent}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Forhåndsvisning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <div><strong>Navn:</strong> {formData.name || 'Ikke angitt'}</div>
                    <div><strong>Beskrivelse:</strong> {formData.description || 'Ikke angitt'}</div>
                    <div><strong>Kategori:</strong> {CATEGORIES.find(c => c.value === formData.category)?.label}</div>
                    <div><strong>Formel:</strong> <code className="bg-muted px-2 py-1 rounded">{formData.expression || 'Ikke angitt'}</code></div>
                    <div><strong>Resultattype:</strong> {RESULT_TYPES.find(t => t.value === formData.resultType)?.label}</div>
                    {formData.interpretation && (
                      <div><strong>Tolkning:</strong> {formData.interpretation}</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test formelen</CardTitle>
                  <CardDescription>
                    Test formelen mot faktiske data (valgfritt)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="testClient">Klient-ID</Label>
                      <Input
                        id="testClient"
                        value={testClientId}
                        onChange={(e) => setTestClientId(e.target.value)}
                        placeholder="Klient UUID for testing"
                      />
                    </div>
                    <div>
                      <Label htmlFor="testYear">År</Label>
                      <Input
                        id="testYear"
                        type="number"
                        value={testYear}
                        onChange={(e) => setTestYear(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {testResult && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Testresultat:</h4>
                      <div className="space-y-1">
                        <div><strong>Verdi:</strong> {testResult.formattedValue}</div>
                        <div><strong>Gyldig:</strong> {testResult.isValid ? 'Ja' : 'Nei'}</div>
                        {testResult.error && (
                          <div className="text-destructive"><strong>Feil:</strong> {testResult.error}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {isTestingFormula && (
                    <div className="text-sm text-muted-foreground">Tester formel...</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name.trim() || !isValidExpression || createFormula.isPending || updateFormula.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {formula ? 'Oppdater' : 'Opprett'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}