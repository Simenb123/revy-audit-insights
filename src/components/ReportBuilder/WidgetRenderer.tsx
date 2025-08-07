import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { KpiWidget } from './Widgets/KpiWidget';
import { TableWidget } from './Widgets/TableWidget';
import { ChartWidget } from './Widgets/ChartWidget';
import { TextWidget } from './Widgets/TextWidget';
import { FormulaWidget } from './Widgets/FormulaWidget';
import { FilterWidget } from './Widgets/FilterWidget';

interface WidgetRendererProps {
  widget: Widget;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.type) {
    case 'filter':
      return <FilterWidget widget={widget} />;
    case 'kpi':
      return <KpiWidget widget={widget} />;
    case 'table':
      return <TableWidget widget={widget} />;
    case 'chart':
      return <ChartWidget widget={widget} />;
    case 'text':
      return <TextWidget widget={widget} />;
    case 'formula':
      return <FormulaWidget widget={widget} />;
    default:
      return (
        <div className="p-4 text-center text-muted-foreground">
          Ukjent widget-type: {widget.type}
        </div>
      );
  }
}