import React from 'react';
import { useWidgetManager, Widget } from '@/contexts/WidgetManagerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BarChart3,
  Table,
  TrendingUp,
  FileText,
  X,
  Calculator,
  Filter,
  Gauge,
  Grid3x3,
  ListOrdered,
  Grid2x2,
  Boxes,
  CircleDot,
  ChartColumn,
  Target,
  Activity,
  Bell,
} from 'lucide-react';
import { useWidgetTemplates } from '@/hooks/useWidgetTemplates';

interface WidgetLibraryProps {
  clientId: string;
  onClose: () => void;
}

export function WidgetLibrary({ clientId, onClose }: WidgetLibraryProps) {
  const { addWidget } = useWidgetManager();
  const { data: dbTemplates, isError: templatesError, isLoading: templatesLoading } = useWidgetTemplates();
  const [selectedSection, setSelectedSection] = React.useState<
    'trial_balance' | 'budget' | 'transactions' | null
  >(null);

  const defaultTemplates = React.useMemo(() => ([
    {
      type: 'filter' as const,
      title: 'Filter',
      description: 'Filtrer data på tvers av widgets',
      icon: Filter,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        showSearch: true,
        showAccountCategory: true,
        showAccountType: false,
        showDateRange: false
      }
    },
    {
      type: 'kpi' as const,
      title: 'Nøkkeltall',
      description: 'Vis viktige finansielle nøkkeltall',
      icon: TrendingUp,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        metric: 'revenue',
        period: 'current_year'
      }
    },
    {
      type: 'budgetKpi' as const,
      title: 'Budsjett KPI',
      description: 'Totalt budsjetterte timer for valgt år',
      icon: TrendingUp,
      section: 'budget' as const,
      dataDescription: 'Henter tall fra budsjettet',
      defaultConfig: {
        period_year: undefined as unknown as number,
      }
    },
    {
      type: 'budgetTable' as const,
      title: 'Budsjett tabell',
      description: 'Timer per medlem eller team',
      icon: Table,
      section: 'budget' as const,
      dataDescription: 'Henter tall fra budsjettet',
      defaultConfig: {
        dimension: 'member' as const,
        maxRows: 10,
      }
    },
    {
      type: 'budgetChart' as const,
      title: 'Budsjett graf',
      description: 'Visualiser budsjetterte timer',
      icon: BarChart3,
      section: 'budget' as const,
      dataDescription: 'Henter tall fra budsjettet',
      defaultConfig: {
        chartType: 'bar',
        dimension: 'team' as const,
        maxDataPoints: 6,
      }
    },
    {
      type: 'table' as const,
      title: 'Saldobalanse tabell',
      description: 'Vis kontosaldoer i tabellformat',
      icon: Table,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        showMappings: true,
        groupByCategory: false,
        dataSource: 'trial_balance'
      }
    },
    {
      type: 'chart' as const,
      title: 'Finansiell graf',
      description: 'Visualiser regnskapsdata som grafer',
      icon: BarChart3,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        chartType: 'bar',
        dataSource: 'trial_balance'
      }
    },
    {
      type: 'heatmap' as const,
      title: 'Heatmap',
      description: 'Vis intensitet i rutenett',
      icon: Grid2x2,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        xField: 'x',
        yField: 'y',
        valueField: 'value',
        colorScale: 'blue',
      }
    },
    {
      type: 'treemap' as const,
      title: 'Treemap',
      description: 'Hierarkisk arealdiagram',
      icon: Boxes,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        valueField: 'size',
        color: '#3b82f6',
      }
    },
    {
      type: 'bubble' as const,
      title: 'Boblediagram',
      description: 'Vis tre variabler',
      icon: CircleDot,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        xField: 'x',
        yField: 'y',
        sizeField: 'z',
        color: '#3b82f6',
      }
    },
    {
      type: 'waterfall' as const,
      title: 'Vannfallsdiagram',
      description: 'Trinnvis endring',
      icon: ChartColumn,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {}
    },
    {
      type: 'enhancedKpi' as const,
      title: 'KPI kort',
      description: 'Nøkkeltall med fargekoder',
      icon: TrendingUp,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        metric: 'revenue',
        threshold: 0,
        positiveColor: 'text-success',
        negativeColor: 'text-destructive'
      }
    },
    {
      type: 'text' as const,
      title: 'Tekstnotat',
      description: 'Legg til tekstnotater og kommentarer',
      icon: FileText,
      section: 'trial_balance' as const,
      dataDescription: 'Manuell tekst, ingen datakilde',
      defaultConfig: {
        content: 'Skriv dine notater her...'
      }
    },
    {
      type: 'formula' as const,
      title: 'Formel/Nøkkeltall',
      description: 'Beregn finansielle nøkkeltall og formler',
      icon: Calculator,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        formulaId: null as string | null,
        showTrend: false,
        showPercentage: false,
        showCurrency: true
      }
    },
    {
      type: 'pivot' as const,
      title: 'Pivot-tabell',
      description: 'Vis data i pivottabell',
      icon: Grid3x3,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: { dataSource: 'trial_balance' }
    },
    {
      type: 'gauge' as const,
      title: 'Måler',
      description: 'Vis en enkel måler',
      icon: Gauge,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {}
    },
    {
      type: 'accountLines' as const,
      title: 'Regnskapslinjer',
      description: 'Vis flere regnskapslinjer og intervaller',
      icon: ListOrdered,
      section: 'transactions' as const,
      dataDescription: 'Basert på transaksjoner',
      defaultConfig: {
        accountLines: [] as string[],
        accountIntervals: [] as string[],
        unitScale: 'none',
        showCurrency: true,
        showYoY: true,
        showShareOf: false,
        shareBaseExpr: '[10]'
      }
    },
    {
      type: 'statementTable' as const,
      title: 'Regnskapsoppstilling',
      description: 'Resultat og balanse med YoY',
      icon: Table,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        showPrevious: true,
        showDifference: true,
        showPercent: true,
        sectionMode: 'both' as const,
      }
    },
    {
      type: 'statementTable' as const,
      title: 'Resultatoppstilling',
      description: 'Kun resultatregnskap',
      icon: Table,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        showPrevious: true,
        showDifference: true,
        showPercent: true,
        sectionMode: 'income' as const,
      }
    },
    {
      type: 'statementTable' as const,
      title: 'Balanseoppstilling',
      description: 'Kun balanse',
      icon: Table,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        showPrevious: true,
        showDifference: true,
        showPercent: true,
        sectionMode: 'balance' as const,
      }
    },
    // New widget types
    {
      type: 'metricCard' as const,
      title: 'Metrikkort',
      description: 'Enkelt kort med nøkkeltall og trend',
      icon: Target,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        unit: 'currency',
        showTrend: true,
        showTarget: false,
        color: 'blue'
      }
    },
    {
      type: 'progress' as const,
      title: 'Fremdrift',
      description: 'Vis fremdrift mot mål',
      icon: Activity,
      section: 'trial_balance' as const,
      dataDescription: 'Basert på saldobalanse',
      defaultConfig: {
        showProgress: true,
        showTargets: true
      }
    },
    {
      type: 'activityFeed' as const,
      title: 'Aktivitetslogg',
      description: 'Vis siste aktiviteter og transaksjoner',
      icon: Bell,
      section: 'transactions' as const,
      dataDescription: 'Basert på transaksjoner',
      defaultConfig: {
        maxItems: 5,
        showUser: true,
        showTimestamp: true
      }
    },
    {
      type: 'alerts' as const,
      title: 'Varsler',
      description: 'Vis viktige varsler og påminnelser',
      icon: Bell,
      section: 'trial_balance' as const,
      dataDescription: 'Systemgenererte varsler',
      defaultConfig: {
        severity: 'all',
        showResolved: false
      }
    },
    {
      type: 'accountHierarchy' as const,
      title: 'Hierarkisk drilldown',
      description: 'Naviger fra kategorier til kontoer til transaksjoner',
      icon: ListOrdered,
      section: 'transactions' as const,
      dataDescription: 'Basert på saldobalanse og transaksjoner',
      defaultConfig: {}
    },
    {
      type: 'metricsExplorer' as const,
      title: 'Metrics Explorer',
      description: 'Utforsk nøkkeltall på alle aggregeringsnivåer',
      icon: Calculator,
      section: 'transactions' as const,
      dataDescription: 'Basert på transaksjoner',
      defaultConfig: {}
    },
    {
      type: 'smartNavigation' as const,
      title: 'Smart navigasjon',
      description: 'Hurtig navigasjon til kontoer og kategorier',
      icon: Target,
      section: 'transactions' as const,
      dataDescription: 'Basert på saldobalanse og transaksjoner',
      defaultConfig: {}
    }
  ]), []);

  const dataSources = [
    {
      key: 'trial_balance' as const,
      label: 'Saldobalanse',
      icon: Table,
      description: 'Kontosaldoer'
    },
    {
      key: 'budget' as const,
      label: 'Budsjett',
      icon: TrendingUp,
      description: 'Planlagte tall'
    },
    {
      key: 'transactions' as const,
      label: 'Transaksjoner',
      icon: ListOrdered,
      description: 'Bokførte linjer'
    }
  ];

  const templates = React.useMemo(() => {
    if (dbTemplates && dbTemplates.length > 0) {
      return dbTemplates.map(t => {
        const fallback = defaultTemplates.find(dt => dt.type === t.type);
        if (fallback) {
          return {
            ...fallback,
            description: t.description,
            defaultConfig: t.defaultConfig,
          };
        }
        return {
          type: t.type as Widget['type'],
          title: t.type,
          description: t.description,
          icon: FileText,
          section: 'trial_balance',
          dataDescription: 'Tilpasset datakilde',
          defaultConfig: t.defaultConfig,
        };
      });
    }
    return defaultTemplates;
  }, [dbTemplates, defaultTemplates]);

  const handleAddWidget = (template: typeof templates[0]) => {
    const widgetId = `widget-${Date.now()}`;
    const widget = {
      id: widgetId,
      type: template.type,
      title: template.title,
      config: { ...template.defaultConfig, clientId }
    };

    const layout = {
      i: widgetId,
      x: 0,
      y: 0,
      w:
        template.type === 'filter'
          ? 4
          : template.type === 'text'
          ? 6
          : template.type === 'kpi' || template.type === 'enhancedKpi' || template.type === 'metricCard'
          ? 3
          : template.type === 'gauge'
          ? 3
          : template.type === 'progress' || template.type === 'activityFeed' || template.type === 'alerts'
          ? 4
          : template.type === 'statementTable'
          ? 8
          : 6,
      h:
        template.type === 'filter'
          ? 4
          : template.type === 'kpi' || template.type === 'enhancedKpi' || template.type === 'metricCard'
          ? 2
          : template.type === 'chart' || template.type === 'heatmap' || template.type === 'treemap' || template.type === 'bubble' || template.type === 'waterfall'
          ? 4
          : template.type === 'pivot'
          ? 4
          : template.type === 'gauge'
          ? 3
          : template.type === 'progress' || template.type === 'activityFeed' || template.type === 'alerts'
          ? 3
          : template.type === 'statementTable'
          ? 4
          : 3,
      widgetId: widgetId,
    };

    addWidget(widget, layout);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {selectedSection ? (
          <Button variant="ghost" size="sm" onClick={() => setSelectedSection(null)}>
            Tilbake
          </Button>
        ) : (
          <div />
        )}
        <h3 className="text-lg font-semibold">
          {selectedSection ? 'Velg widget' : 'Velg datakilde'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {templatesError && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Maler er ikke tilgjengelig akkurat nå. Standard widgets er tilgjengelig.
          </p>
        </div>
      )}

      {templatesLoading && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Laster widget-maler...
          </p>
        </div>
      )}

      {selectedSection ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Hold musen over en widget for en kort forklaring.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates
              .filter((template) => template.section === selectedSection)
              .map((template) => (
                <Tooltip key={`${template.type}-${template.title}`}>
                  <TooltipTrigger asChild>
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleAddWidget(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <template.icon className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-sm">{template.title}</CardTitle>
                            <p className="text-xs text-muted-foreground">{template.dataDescription}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>{template.description}</TooltipContent>
                </Tooltip>
              ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dataSources.map((ds) => (
            <Card
              key={ds.key}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedSection(ds.key)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ds.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm">{ds.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  {ds.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}