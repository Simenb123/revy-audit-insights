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
} from 'lucide-react';
import { useWidgetTemplates } from '@/hooks/useWidgetTemplates';

interface WidgetLibraryProps {
  clientId: string;
  onClose: () => void;
}

export function WidgetLibrary({ clientId, onClose }: WidgetLibraryProps) {
  const { addWidget } = useWidgetManager();
  const { data: dbTemplates } = useWidgetTemplates();

  const defaultTemplates = React.useMemo(() => ([
    {
      type: 'filter' as const,
      title: 'Filter',
      description: 'Filtrer data på tvers av widgets',
      icon: Filter,
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
      defaultConfig: {
        period_year: undefined as unknown as number,
      }
    },
    {
      type: 'budgetTable' as const,
      title: 'Budsjett tabell',
      description: 'Timer per medlem eller team',
      icon: Table,
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
      defaultConfig: {}
    },
    {
      type: 'enhancedKpi' as const,
      title: 'KPI kort',
      description: 'Nøkkeltall med fargekoder',
      icon: TrendingUp,
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
      defaultConfig: {
        content: 'Skriv dine notater her...'
      }
    },
    {
      type: 'formula' as const,
      title: 'Formel/Nøkkeltall',
      description: 'Beregn finansielle nøkkeltall og formler',
      icon: Calculator,
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
      defaultConfig: { dataSource: 'trial_balance' }
    },
    {
      type: 'gauge' as const,
      title: 'Måler',
      description: 'Vis en enkel måler',
      icon: Gauge,
      defaultConfig: {}
    },
    {
      type: 'accountLines' as const,
      title: 'Regnskapslinjer',
      description: 'Vis flere regnskapslinjer og intervaller',
      icon: ListOrdered,
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
      defaultConfig: {
        showPrevious: true,
        showDifference: true,
        showPercent: true,
        sectionMode: 'balance' as const,
      }
    }
  ]), []);

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
          : template.type === 'kpi' || template.type === 'enhancedKpi'
          ? 3
          : template.type === 'gauge'
          ? 3
          : template.type === 'statementTable'
          ? 8
          : 6,
      h:
        template.type === 'filter'
          ? 4
          : template.type === 'kpi' || template.type === 'enhancedKpi'
          ? 2
          : template.type === 'chart' || template.type === 'heatmap' || template.type === 'treemap' || template.type === 'bubble' || template.type === 'waterfall'
          ? 4
          : template.type === 'pivot'
          ? 4
          : template.type === 'gauge'
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
        <h3 className="text-lg font-semibold">Velg widget type</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Hold musen over en widget for en kort forklaring.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Tooltip key={`${template.type}-${template.title}`}>
            <TooltipTrigger asChild>
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleAddWidget(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <template.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm">{template.title}</CardTitle>
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
  );
}