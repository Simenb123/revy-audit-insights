import React from 'react';
import { useWidgetManager, Widget } from '@/contexts/WidgetManagerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { useWidgetTemplates } from '@/hooks/useWidgetTemplates';

interface WidgetLibraryProps {
  clientId: string;
  onClose: () => void;
}

export function WidgetLibrary({ clientId, onClose }: WidgetLibraryProps) {
  const { addWidget } = useWidgetManager();
  const { data: dbTemplates } = useWidgetTemplates();

  const defaultTemplates = [
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
      type: 'table' as const,
      title: 'Saldobalanse tabell',
      description: 'Vis kontosaldoer i tabellformat',
      icon: Table,
      defaultConfig: {
        showMappings: true,
        groupByCategory: false
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
      defaultConfig: {
        data: []
      }
    },
    {
      type: 'gauge' as const,
      title: 'Måler',
      description: 'Vis en enkel måler',
      icon: Gauge,
      defaultConfig: {
        value: 50,
        max: 100
      }
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
          defaultConfig: t.defaultConfig,
        };
      });
    }
    return defaultTemplates;
  }, [dbTemplates]);

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
          : template.type === 'kpi'
          ? 3
          : template.type === 'gauge'
          ? 3
          : 6,
      h:
        template.type === 'filter'
          ? 4
          : template.type === 'kpi'
          ? 2
          : template.type === 'chart'
          ? 4
          : template.type === 'pivot'
          ? 4
          : template.type === 'gauge'
          ? 3
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.type} 
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
        ))}
      </div>
    </div>
  );
}