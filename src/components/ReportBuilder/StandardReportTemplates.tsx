import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calculator, TrendingUp, Building, X } from 'lucide-react';
import { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';
import { useReportTemplates, ReportTemplate } from '@/hooks/useReportTemplates';

const iconMap: Record<string, React.ComponentType<any>> = {
  calculator: Calculator,
  'trending-up': TrendingUp,
  'bar-chart-3': BarChart3,
  building: Building,
};

interface StandardReportTemplatesProps {
  clientId: string;
  onApplyTemplate: (widgets: Widget[], layouts: WidgetLayout[]) => void;
  onClose: () => void;
}

export function StandardReportTemplates({ clientId, onApplyTemplate, onClose }: StandardReportTemplatesProps) {
  const { data: reportTemplates = [], isLoading, error } = useReportTemplates();

  const handleApplyTemplate = (template: ReportTemplate) => {
    const widgets: Widget[] = template.widgets.map((widget, index) => ({
      ...widget,
      id: `widget-${Date.now()}-${index}`,
      config: {
        ...widget.config,
        clientId,
      },
    }));

    const layouts: WidgetLayout[] = template.layouts.map((layout, index) => ({
      ...layout,
      i: widgets[index].id,
      widgetId: widgets[index].id,
    }));

    onApplyTemplate(widgets, layouts);
    onClose();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Standard Rapport Maler</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div>Laster...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Standard Rapport Maler</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div>Kunne ikke hente rapportmaler</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Standard Rapport Maler</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTemplates.map((template) => {
          const Icon = template.icon ? iconMap[template.icon] || BarChart3 : BarChart3;
          return (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleApplyTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
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
          );
        })}
      </div>
    </div>
  );
}
