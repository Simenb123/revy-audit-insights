import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { KpiWidget } from './Widgets/KpiWidget';
import { TableWidget } from './Widgets/TableWidget';
import { ChartWidget } from './Widgets/ChartWidget';
import { TextWidget } from './Widgets/TextWidget';
import { FormulaWidget } from './Widgets/FormulaWidget';
import { FilterWidget } from './Widgets/FilterWidget';
import { PivotWidget } from './Widgets/PivotWidget';
import { GaugeWidget } from './Widgets/GaugeWidget';
import { AccountLinesWidget } from './Widgets/AccountLinesWidget';
import { StatementTableWidget } from './Widgets/StatementTableWidget';
import { BudgetKpiWidget } from './Widgets/BudgetKpiWidget';
import { BudgetTableWidget } from './Widgets/BudgetTableWidget';
import { BudgetChartWidget } from './Widgets/BudgetChartWidget';
import { HeatmapWidget } from './Widgets/HeatmapWidget';
import { TreemapWidget } from './Widgets/TreemapWidget';
import { BubbleChartWidget } from './Widgets/BubbleChartWidget';
import { EnhancedKpiWidget } from './Widgets/EnhancedKpiWidget';

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
    case 'pivot':
      return <PivotWidget widget={widget} />;
    case 'gauge':
      return <GaugeWidget widget={widget} />;
    case 'accountLines':
      return <AccountLinesWidget widget={widget} />;
    case 'statementTable':
      return <StatementTableWidget widget={widget} />;
    case 'budgetKpi':
      return <BudgetKpiWidget widget={widget} />;
    case 'budgetTable':
      return <BudgetTableWidget widget={widget} />;
    case 'budgetChart':
      return <BudgetChartWidget widget={widget} />;
    case 'heatmap':
      return <HeatmapWidget widget={widget} />;
    case 'treemap':
      return <TreemapWidget widget={widget} />;
    case 'bubble':
      return <BubbleChartWidget widget={widget} />;
    case 'enhancedKpi':
      return <EnhancedKpiWidget widget={widget} />;
    default:
      return (
        <div className="p-4 text-center text-muted-foreground">
          Ukjent widget-type: {widget.type}
        </div>
      );
  }
}
