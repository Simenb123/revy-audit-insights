import React from 'react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Table, TrendingUp, FileText, X } from 'lucide-react';

interface WidgetLibraryProps {
  clientId: string;
  onClose: () => void;
}

export function WidgetLibrary({ clientId, onClose }: WidgetLibraryProps) {
  const { addWidget } = useWidgetManager();

  const widgetTemplates = [
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
    }
  ];

  const handleAddWidget = (template: typeof widgetTemplates[0]) => {
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
      w: template.type === 'text' ? 6 : template.type === 'kpi' ? 3 : 6,
      h: template.type === 'kpi' ? 2 : template.type === 'chart' ? 4 : 3,
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
        {widgetTemplates.map((template) => (
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