import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, TrendingUp, DollarSign, Activity, Target, BarChart3, Calculator, Pencil } from 'lucide-react';
import { useFormulaDefinitions, useDeleteFormulaDefinition, FormulaDefinition } from '@/hooks/useFormulas';
import { KPI_LIBRARY, KPI_CATEGORIES, KpiDefinition } from '@/lib/kpiLibrary';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import KeyFigureEditor from '@/components/KeyFigure/KeyFigureEditor';
import { FormulaAccountMapper } from '@/components/KeyFigure/FormulaAccountMapper';
import { VisualFormulaTester } from '@/components/KeyFigure/VisualFormulaTester';
import { FormulaDebugger } from '@/components/KeyFigure/FormulaDebugger';
import { FormulaValidatorComponent } from '@/components/KeyFigure/FormulaValidatorComponent';
import { FormulaSuggestions } from '@/components/KeyFigure/FormulaSuggestions';

const categoryIcons = {
  profitability: TrendingUp,
  liquidity: DollarSign,
  solvency: Activity,
  efficiency: Target,
  growth: BarChart3,
} as const;

const categoryColors = {
  profitability: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  liquidity: 'bg-blue-100 text-blue-800 border-blue-200',
  solvency: 'bg-purple-100 text-purple-800 border-purple-200',
  efficiency: 'bg-orange-100 text-orange-800 border-orange-200',
  growth: 'bg-pink-100 text-pink-800 border-pink-200',
} as const;

export default function KeyFigureManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormula, setSelectedFormula] = useState<FormulaDefinition | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const { data: customFormulas = [], isLoading, refetch } = useFormulaDefinitions();
  const { mutate: deleteFormula } = useDeleteFormulaDefinition();
  const { toast } = useToast();

  // Combine standard KPIs with custom formulas
  const allKeyFigures = [
    ...KPI_LIBRARY.map(kpi => ({
      ...kpi,
      isSystem: true,
      type: 'kpi' as const
    })),
    ...customFormulas.map(formula => ({
      id: formula.id,
      name: formula.name,
      description: formula.description || 'Egendefinert formel',
      category: formula.category || 'custom',
      isSystem: false,
      type: 'formula' as const,
      formula: formula.formula_expression
    }))
  ];

  // Filter key figures based on search and category
  const filteredKeyFigures = allKeyFigures.filter(kf => {
    const matchesSearch = kf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         kf.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || kf.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedKeyFigures = filteredKeyFigures.reduce((acc, kf) => {
    const category = kf.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(kf);
    return acc;
  }, {} as Record<string, typeof filteredKeyFigures>);

  const handleDeleteFormula = (formulaId: string, formulaName: string) => {
    deleteFormula(formulaId, {
      onSuccess: () => {
        toast({
          title: "Formel slettet",
          description: `"${formulaName}" ble slettet.`
        });
      },
      onError: (error) => {
        toast({
          title: "Feil ved sletting",
          description: "Kunne ikke slette formelen. Prøv igjen.",
          variant: "destructive"
        });
      }
    });
  };

  const handleCreateNew = () => {
    setSelectedFormula(null);
    setIsEditorOpen(true);
  };

  const handleEditFormula = (formula: any) => {
    // Convert to FormulaDefinition format
    const formulaData: FormulaDefinition = {
      id: formula.id,
      name: formula.name,
      description: formula.description,
      formula_expression: formula.formula,
      category: formula.category,
      is_system_formula: formula.isSystem,
      created_by: '',
      created_at: '',
      updated_at: '',
      version: 1,
      is_active: true,
      metadata: {}
    };
    setSelectedFormula(formulaData);
    setIsEditorOpen(true);
  };

  const handleEditorSuccess = () => {
    refetch();
    setShowAdvancedTools(true); // Show advanced tools after creating/editing
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedFormula(null);
  };

  const getCategoryInfo = (category: string) => {
    if (category === 'custom') {
      return { name: 'Egendefinerte', description: 'Brukerdefinerte formler og nøkkeltall' };
    }
    return KPI_CATEGORIES[category as keyof typeof KPI_CATEGORIES] || { name: category, description: '' };
  };

  const getCategoryIcon = (category: string) => {
    if (category === 'custom') return Target;
    return categoryIcons[category as keyof typeof categoryIcons] || Target;
  };

  const getCategoryColor = (category: string) => {
    if (category === 'custom') return 'bg-gray-100 text-gray-800 border-gray-200';
    return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const stats = {
    total: allKeyFigures.length,
    system: allKeyFigures.filter(kf => kf.isSystem).length,
    custom: allKeyFigures.filter(kf => !kf.isSystem).length,
    categories: Object.keys(groupedKeyFigures).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nøkkeltall Manager</h1>
          <p className="text-muted-foreground">
            Administrer og opprett nøkkeltall og formler for finansanalyse
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Opprett nøkkeltall
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            {showAdvancedTools ? 'Skjul verktøy' : 'Vis verktøy'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">nøkkeltall tilgjengelig</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.system}</div>
            <p className="text-xs text-muted-foreground">standard nøkkeltall</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egendefinerte</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.custom}</div>
            <p className="text-xs text-muted-foreground">tilpassede formler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategorier</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">ulike kategorier</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter og søk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Søk etter nøkkeltall..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="profitability">Lønnsomhet</TabsTrigger>
              <TabsTrigger value="liquidity">Likviditet</TabsTrigger>
              <TabsTrigger value="solvency">Soliditet</TabsTrigger>
              <TabsTrigger value="efficiency">Effektivitet</TabsTrigger>
              <TabsTrigger value="growth">Vekst</TabsTrigger>
              <TabsTrigger value="custom">Egendefinerte</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Key Figures List */}
      <div className="space-y-6">
        {Object.entries(groupedKeyFigures).map(([category, keyFigures]) => {
          const categoryInfo = getCategoryInfo(category);
          const CategoryIcon = getCategoryIcon(category);
          
          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CategoryIcon className="h-5 w-5" />
                  <div>
                    <CardTitle>{categoryInfo.name}</CardTitle>
                    <CardDescription>{categoryInfo.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className={getCategoryColor(category)}>
                    {keyFigures.length} nøkkeltall
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {keyFigures.map((kf) => (
                    <Card key={kf.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium">{kf.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {kf.description}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            {kf.isSystem ? (
                              <Badge variant="outline" className="text-xs">System</Badge>
                            ) : (
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditFormula(kf)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Slett nøkkeltall</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Er du sikker på at du vil slette "{kf.name}"? Denne handlingen kan ikke angres.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteFormula(kf.id, kf.name)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Slett
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {kf.type === 'kpi' && 'benchmarks' in kf && kf.benchmarks && (
                            <div className="text-xs text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Benchmark:</span>
                                <span>{kf.benchmarks.excellent}{kf.displayAsPercentage ? '%' : ''} (utmerket)</span>
                              </div>
                            </div>
                          )}
                          {kf.type === 'kpi' && 'interpretation' in kf && kf.interpretation && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {kf.interpretation}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAdvancedTools && selectedFormula && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="space-y-6">
            <FormulaAccountMapper
              formulaExpression={selectedFormula.formula_expression}
              clientId={selectedClientId}
            />
            
            <VisualFormulaTester
              formulaExpression={selectedFormula.formula_expression}
              formulaId={selectedFormula.id}
              clientId={selectedClientId}
              format="number"
            />
          </div>
          
          <div>
            <FormulaDebugger
              formulaExpression={selectedFormula.formula_expression}
            />
          </div>
          
          <div>
            <FormulaValidatorComponent
              formula={selectedFormula.formula_expression}
              formulaId={selectedFormula.id}
              allFormulas={allKeyFigures.filter(kf => 'formula' in kf).map((kf: any) => ({
                id: kf.id,
                formula_expression: kf.formula
              }))}
              allowedAccounts={[]} // TODO: Get from client's chart of accounts
            />
          </div>
        </div>
      )}
      
      {/* AI Formula Suggestions */}
      <FormulaSuggestions
        clientId={selectedClientId}
        onSelectSuggestion={(suggestion: any) => {
          // Create new formula from suggestion
          const newFormula = {
            name: suggestion.name,
            description: suggestion.description,
            formula_expression: suggestion.formula,
            category: suggestion.category,
            format: 'number' as const,
          };
          setSelectedFormula(newFormula as any);
          setIsEditorOpen(true);
        }}
      />

      {filteredKeyFigures.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen nøkkeltall funnet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Prøv å justere søkekriteriene eller opprett et nytt nøkkeltall.
            </p>
          </CardContent>
        </Card>
      )}

      <KeyFigureEditor
        formula={selectedFormula}
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        onSuccess={handleEditorSuccess}
      />
    </div>
  );
}