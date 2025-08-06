import React, { useState } from 'react';
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import AccountingOverview from './Widgets/AccountingOverview';
import FinancialRatios from './Widgets/FinancialRatios';
import RevenueAnalysis from './Widgets/RevenueAnalysis';
import ExpenseAnalysis from './Widgets/ExpenseAnalysis';
import RiskAssessment from './Widgets/RiskAssessment';
import ProjectCard from './Widgets/ProjectCard';

type WidgetKey =
  | 'accountingOverview'
  | 'financialRatios'
  | 'revenueAnalysis'
  | 'expenseAnalysis'
  | 'riskAssessment'
  | 'projectCard';

const widgetComponents: Record<WidgetKey, React.FC<{ className?: string }>> = {
  accountingOverview: AccountingOverview,
  financialRatios: FinancialRatios,
  revenueAnalysis: RevenueAnalysis,
  expenseAnalysis: ExpenseAnalysis,
  riskAssessment: RiskAssessment,
  projectCard: ProjectCard,
};

const defaultWidgets: { id: string; type: WidgetKey }[] = [
  { id: '1', type: 'accountingOverview' },
  { id: '2', type: 'financialRatios' },
  { id: '3', type: 'revenueAnalysis' },
  { id: '4', type: 'expenseAnalysis' },
  { id: '5', type: 'riskAssessment' },
  { id: '6', type: 'projectCard' },
];

const initialLayout: Layout[] = [
  { i: '1', x: 0, y: 0, w: 2, h: 2 },
  { i: '2', x: 2, y: 0, w: 1, h: 1 },
  { i: '3', x: 0, y: 2, w: 1, h: 1 },
  { i: '4', x: 1, y: 2, w: 1, h: 1 },
  { i: '5', x: 2, y: 1, w: 1, h: 2 },
  { i: '6', x: 3, y: 0, w: 1, h: 3 },
];

const ReactGridLayout = WidthProvider(GridLayout);

const DashboardGrid = () => {
  const [layout, setLayout] = useState<Layout[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardLayout');
      return saved ? JSON.parse(saved) : initialLayout;
    }
    return initialLayout;
  });

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
    }
  };

  return (
    <div className="p-2">
      <ReactGridLayout
        layout={layout}
        cols={4}
        rowHeight={150}
        onLayoutChange={handleLayoutChange}
        className="layout"
      >
        {defaultWidgets.map((widget) => {
          const WidgetComponent = widgetComponents[widget.type];
          return (
            <div
              key={widget.id}
              className="rounded-lg border bg-card text-card-foreground shadow-md"
            >
              <WidgetComponent className="h-full" />
            </div>
          );
        })}
      </ReactGridLayout>
    </div>
  );
};

export default DashboardGrid;

