import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calculator, TrendingUp, Building, X } from 'lucide-react';
import { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

interface StandardReportTemplatesProps {
  clientId: string;
  onApplyTemplate: (widgets: Widget[], layouts: WidgetLayout[]) => void;
  onClose: () => void;
}

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  widgets: Omit<Widget, 'id'>[];
  layouts: Omit<WidgetLayout, 'i' | 'widgetId'>[];
}

export function StandardReportTemplates({ clientId, onApplyTemplate, onClose }: StandardReportTemplatesProps) {
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'key-figures-dashboard',
      title: 'Nøkkeltall Dashboard',
      description: 'Standard finansielle nøkkeltall som likviditetsgrad, soliditetsgrad og lønnsomhet',
      icon: Calculator,
      widgets: [
        {
          type: 'formula',
          title: 'Likviditetsgrad',
          config: {
            clientId,
            formulaId: 'current-ratio',
            showTrend: true,
            showPercentage: false,
            showCurrency: false
          }
        },
        {
          type: 'formula',
          title: 'Soliditetsgrad',
          config: {
            clientId,
            formulaId: 'equity-ratio',
            showTrend: true,
            showPercentage: true,
            showCurrency: false
          }
        },
        {
          type: 'formula',
          title: 'Bruttofortjeneste',
          config: {
            clientId,
            formulaId: 'gross-margin',
            showTrend: true,
            showPercentage: true,
            showCurrency: false
          }
        },
        {
          type: 'formula',
          title: 'Driftsmargin',
          config: {
            clientId,
            formulaId: 'operating-margin',
            showTrend: true,
            showPercentage: true,
            showCurrency: false
          }
        }
      ],
      layouts: [
        { x: 0, y: 0, w: 3, h: 2 },
        { x: 3, y: 0, w: 3, h: 2 },
        { x: 6, y: 0, w: 3, h: 2 },
        { x: 9, y: 0, w: 3, h: 2 }
      ]
    },
    {
      id: 'profit-loss-overview',
      title: 'Resultatregnskap',
      description: 'Strukturert P&L oversikt med klassifiserte kontoer og nøkkeltall',
      icon: TrendingUp,
      widgets: [
        {
          type: 'table',
          title: 'Driftsinntekter',
          config: {
            clientId,
            showMappings: true,
            groupByCategory: true,
            filterByClassification: 'REVENUE'
          }
        },
        {
          type: 'table',
          title: 'Driftskostnader',
          config: {
            clientId,
            showMappings: true,
            groupByCategory: true,
            filterByClassification: 'EXPENSE'
          }
        },
        {
          type: 'formula',
          title: 'Driftsresultat',
          config: {
            clientId,
            formulaId: 'operating-result',
            showTrend: true,
            showPercentage: false,
            showCurrency: true
          }
        },
        {
          type: 'chart',
          title: 'Kostnadsdistribusjon',
          config: {
            clientId,
            chartType: 'pie',
            dataSource: 'trial_balance',
            filterByClassification: 'EXPENSE'
          }
        }
      ],
      layouts: [
        { x: 0, y: 0, w: 6, h: 4 },
        { x: 6, y: 0, w: 6, h: 4 },
        { x: 0, y: 4, w: 4, h: 2 },
        { x: 4, y: 4, w: 8, h: 4 }
      ]
    },
    {
      id: 'balance-overview',
      title: 'Balanse Oversikt',
      description: 'Eiendeler, gjeld og egenkapital med gruppering og forholdstall',
      icon: Building,
      widgets: [
        {
          type: 'table',
          title: 'Eiendeler',
          config: {
            clientId,
            showMappings: true,
            groupByCategory: true,
            filterByClassification: 'ASSET'
          }
        },
        {
          type: 'table',
          title: 'Gjeld og Egenkapital',
          config: {
            clientId,
            showMappings: true,
            groupByCategory: true,
            filterByClassification: 'LIABILITY_EQUITY'
          }
        },
        {
          type: 'formula',
          title: 'Arbeidskapital',
          config: {
            clientId,
            formulaId: 'working-capital',
            showTrend: true,
            showPercentage: false,
            showCurrency: true
          }
        },
        {
          type: 'chart',
          title: 'Balanse Visualisering',
          config: {
            clientId,
            chartType: 'bar',
            dataSource: 'trial_balance'
          }
        }
      ],
      layouts: [
        { x: 0, y: 0, w: 6, h: 4 },
        { x: 6, y: 0, w: 6, h: 4 },
        { x: 0, y: 4, w: 4, h: 2 },
        { x: 4, y: 4, w: 8, h: 4 }
      ]
    },
    {
      id: 'liquidity-analysis',
      title: 'Likviditetsanalyse',
      description: 'Detaljert analyse av likviditet og arbeidskapital',
      icon: BarChart3,
      widgets: [
        {
          type: 'formula',
          title: 'Likviditetsgrad 1',
          config: {
            clientId,
            formulaId: 'current-ratio',
            showTrend: true,
            showPercentage: false,
            showCurrency: false
          }
        },
        {
          type: 'formula',
          title: 'Likviditetsgrad 2',
          config: {
            clientId,
            formulaId: 'quick-ratio',
            showTrend: true,
            showPercentage: false,
            showCurrency: false
          }
        },
        {
          type: 'table',
          title: 'Omløpsmidler',
          config: {
            clientId,
            showMappings: true,
            groupByCategory: true,
            filterByClassification: 'CURRENT_ASSET'
          }
        },
        {
          type: 'table',
          title: 'Kortsiktig gjeld',
          config: {
            clientId,
            showMappings: true,
            groupByCategory: true,
            filterByClassification: 'CURRENT_LIABILITY'
          }
        }
      ],
      layouts: [
        { x: 0, y: 0, w: 3, h: 2 },
        { x: 3, y: 0, w: 3, h: 2 },
        { x: 6, y: 0, w: 6, h: 3 },
        { x: 0, y: 2, w: 6, h: 3 }
      ]
    }
  ];

  const handleApplyTemplate = (template: ReportTemplate) => {
    const widgets: Widget[] = template.widgets.map((widget, index) => ({
      ...widget,
      id: `widget-${Date.now()}-${index}`
    }));

    const layouts: WidgetLayout[] = template.layouts.map((layout, index) => ({
      ...layout,
      i: widgets[index].id,
      widgetId: widgets[index].id
    }));

    onApplyTemplate(widgets, layouts);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Standard Rapport Maler</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleApplyTemplate(template)}
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
              <div className="mt-2 text-xs text-muted-foreground">
                {template.widgets.length} widgets
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}