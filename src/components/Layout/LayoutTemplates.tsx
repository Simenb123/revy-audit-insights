import React from 'react';
import { Layout } from 'react-grid-layout';

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  layout: Layout[];
  preview: string;
  category: 'dashboard' | 'report' | 'analytics' | 'kpi';
  responsive: {
    lg: Layout[];
    md: Layout[];
    sm: Layout[];
    xs: Layout[];
  };
}

export const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'kpi-dashboard',
    name: 'KPI Dashboard',
    description: 'Key performance indicators with charts',
    layout: [
      { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
      { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 },
      { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 },
      { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 },
      { i: 'chart-1', x: 0, y: 2, w: 6, h: 4 },
      { i: 'chart-2', x: 6, y: 2, w: 6, h: 4 },
      { i: 'table-1', x: 0, y: 6, w: 12, h: 3 }
    ],
    preview: '📊',
    category: 'dashboard',
    responsive: {
      lg: [
        { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
        { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 },
        { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 },
        { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 },
        { i: 'chart-1', x: 0, y: 2, w: 6, h: 4 },
        { i: 'chart-2', x: 6, y: 2, w: 6, h: 4 },
        { i: 'table-1', x: 0, y: 6, w: 12, h: 3 }
      ],
      md: [
        { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
        { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 },
        { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 },
        { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 },
        { i: 'chart-1', x: 0, y: 2, w: 6, h: 4 },
        { i: 'chart-2', x: 6, y: 2, w: 6, h: 4 },
        { i: 'table-1', x: 0, y: 6, w: 12, h: 3 }
      ],
      sm: [
        { i: 'kpi-1', x: 0, y: 0, w: 6, h: 2 },
        { i: 'kpi-2', x: 6, y: 0, w: 6, h: 2 },
        { i: 'kpi-3', x: 0, y: 2, w: 6, h: 2 },
        { i: 'kpi-4', x: 6, y: 2, w: 6, h: 2 },
        { i: 'chart-1', x: 0, y: 4, w: 12, h: 4 },
        { i: 'chart-2', x: 0, y: 8, w: 12, h: 4 },
        { i: 'table-1', x: 0, y: 12, w: 12, h: 3 }
      ],
      xs: [
        { i: 'kpi-1', x: 0, y: 0, w: 12, h: 2 },
        { i: 'kpi-2', x: 0, y: 2, w: 12, h: 2 },
        { i: 'kpi-3', x: 0, y: 4, w: 12, h: 2 },
        { i: 'kpi-4', x: 0, y: 6, w: 12, h: 2 },
        { i: 'chart-1', x: 0, y: 8, w: 12, h: 4 },
        { i: 'chart-2', x: 0, y: 12, w: 12, h: 4 },
        { i: 'table-1', x: 0, y: 16, w: 12, h: 3 }
      ]
    }
  },
  {
    id: 'financial-report',
    name: 'Financial Report',
    description: 'Comprehensive financial overview',
    layout: [
      { i: 'summary-1', x: 0, y: 0, w: 12, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 8, h: 4 },
      { i: 'profit-kpi', x: 8, y: 2, w: 4, h: 2 },
      { i: 'expenses-kpi', x: 8, y: 4, w: 4, h: 2 },
      { i: 'breakdown-table', x: 0, y: 6, w: 12, h: 4 }
    ],
    preview: '💰',
    category: 'report',
    responsive: {
      lg: [
        { i: 'summary-1', x: 0, y: 0, w: 12, h: 2 },
        { i: 'revenue-chart', x: 0, y: 2, w: 8, h: 4 },
        { i: 'profit-kpi', x: 8, y: 2, w: 4, h: 2 },
        { i: 'expenses-kpi', x: 8, y: 4, w: 4, h: 2 },
        { i: 'breakdown-table', x: 0, y: 6, w: 12, h: 4 }
      ],
      md: [
        { i: 'summary-1', x: 0, y: 0, w: 12, h: 2 },
        { i: 'revenue-chart', x: 0, y: 2, w: 8, h: 4 },
        { i: 'profit-kpi', x: 8, y: 2, w: 4, h: 2 },
        { i: 'expenses-kpi', x: 8, y: 4, w: 4, h: 2 },
        { i: 'breakdown-table', x: 0, y: 6, w: 12, h: 4 }
      ],
      sm: [
        { i: 'summary-1', x: 0, y: 0, w: 12, h: 2 },
        { i: 'revenue-chart', x: 0, y: 2, w: 12, h: 4 },
        { i: 'profit-kpi', x: 0, y: 6, w: 6, h: 2 },
        { i: 'expenses-kpi', x: 6, y: 6, w: 6, h: 2 },
        { i: 'breakdown-table', x: 0, y: 8, w: 12, h: 4 }
      ],
      xs: [
        { i: 'summary-1', x: 0, y: 0, w: 12, h: 2 },
        { i: 'revenue-chart', x: 0, y: 2, w: 12, h: 4 },
        { i: 'profit-kpi', x: 0, y: 6, w: 12, h: 2 },
        { i: 'expenses-kpi', x: 0, y: 8, w: 12, h: 2 },
        { i: 'breakdown-table', x: 0, y: 10, w: 12, h: 4 }
      ]
    }
  },
  {
    id: 'analytics-overview',
    name: 'Analytics Overview',
    description: 'Data analytics and trends',
    layout: [
      { i: 'metric-1', x: 0, y: 0, w: 2, h: 2 },
      { i: 'metric-2', x: 2, y: 0, w: 2, h: 2 },
      { i: 'metric-3', x: 4, y: 0, w: 2, h: 2 },
      { i: 'metric-4', x: 6, y: 0, w: 2, h: 2 },
      { i: 'metric-5', x: 8, y: 0, w: 2, h: 2 },
      { i: 'metric-6', x: 10, y: 0, w: 2, h: 2 },
      { i: 'trend-chart', x: 0, y: 2, w: 12, h: 4 },
      { i: 'distribution-chart', x: 0, y: 6, w: 6, h: 3 },
      { i: 'performance-chart', x: 6, y: 6, w: 6, h: 3 }
    ],
    preview: '📈',
    category: 'analytics',
    responsive: {
      lg: [
        { i: 'metric-1', x: 0, y: 0, w: 2, h: 2 },
        { i: 'metric-2', x: 2, y: 0, w: 2, h: 2 },
        { i: 'metric-3', x: 4, y: 0, w: 2, h: 2 },
        { i: 'metric-4', x: 6, y: 0, w: 2, h: 2 },
        { i: 'metric-5', x: 8, y: 0, w: 2, h: 2 },
        { i: 'metric-6', x: 10, y: 0, w: 2, h: 2 },
        { i: 'trend-chart', x: 0, y: 2, w: 12, h: 4 },
        { i: 'distribution-chart', x: 0, y: 6, w: 6, h: 3 },
        { i: 'performance-chart', x: 6, y: 6, w: 6, h: 3 }
      ],
      md: [
        { i: 'metric-1', x: 0, y: 0, w: 3, h: 2 },
        { i: 'metric-2', x: 3, y: 0, w: 3, h: 2 },
        { i: 'metric-3', x: 6, y: 0, w: 3, h: 2 },
        { i: 'metric-4', x: 9, y: 0, w: 3, h: 2 },
        { i: 'metric-5', x: 0, y: 2, w: 6, h: 2 },
        { i: 'metric-6', x: 6, y: 2, w: 6, h: 2 },
        { i: 'trend-chart', x: 0, y: 4, w: 12, h: 4 },
        { i: 'distribution-chart', x: 0, y: 8, w: 6, h: 3 },
        { i: 'performance-chart', x: 6, y: 8, w: 6, h: 3 }
      ],
      sm: [
        { i: 'metric-1', x: 0, y: 0, w: 6, h: 2 },
        { i: 'metric-2', x: 6, y: 0, w: 6, h: 2 },
        { i: 'metric-3', x: 0, y: 2, w: 6, h: 2 },
        { i: 'metric-4', x: 6, y: 2, w: 6, h: 2 },
        { i: 'metric-5', x: 0, y: 4, w: 6, h: 2 },
        { i: 'metric-6', x: 6, y: 4, w: 6, h: 2 },
        { i: 'trend-chart', x: 0, y: 6, w: 12, h: 4 },
        { i: 'distribution-chart', x: 0, y: 10, w: 12, h: 3 },
        { i: 'performance-chart', x: 0, y: 13, w: 12, h: 3 }
      ],
      xs: [
        { i: 'metric-1', x: 0, y: 0, w: 12, h: 2 },
        { i: 'metric-2', x: 0, y: 2, w: 12, h: 2 },
        { i: 'metric-3', x: 0, y: 4, w: 12, h: 2 },
        { i: 'metric-4', x: 0, y: 6, w: 12, h: 2 },
        { i: 'metric-5', x: 0, y: 8, w: 12, h: 2 },
        { i: 'metric-6', x: 0, y: 10, w: 12, h: 2 },
        { i: 'trend-chart', x: 0, y: 12, w: 12, h: 4 },
        { i: 'distribution-chart', x: 0, y: 16, w: 12, h: 3 },
        { i: 'performance-chart', x: 0, y: 19, w: 12, h: 3 }
      ]
    }
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview for executives',
    layout: [
      { i: 'title-section', x: 0, y: 0, w: 12, h: 1 },
      { i: 'key-metrics', x: 0, y: 1, w: 12, h: 2 },
      { i: 'main-chart', x: 0, y: 3, w: 8, h: 5 },
      { i: 'insights', x: 8, y: 3, w: 4, h: 5 },
      { i: 'action-items', x: 0, y: 8, w: 12, h: 2 }
    ],
    preview: '📋',
    category: 'kpi',
    responsive: {
      lg: [
        { i: 'title-section', x: 0, y: 0, w: 12, h: 1 },
        { i: 'key-metrics', x: 0, y: 1, w: 12, h: 2 },
        { i: 'main-chart', x: 0, y: 3, w: 8, h: 5 },
        { i: 'insights', x: 8, y: 3, w: 4, h: 5 },
        { i: 'action-items', x: 0, y: 8, w: 12, h: 2 }
      ],
      md: [
        { i: 'title-section', x: 0, y: 0, w: 12, h: 1 },
        { i: 'key-metrics', x: 0, y: 1, w: 12, h: 2 },
        { i: 'main-chart', x: 0, y: 3, w: 8, h: 5 },
        { i: 'insights', x: 8, y: 3, w: 4, h: 5 },
        { i: 'action-items', x: 0, y: 8, w: 12, h: 2 }
      ],
      sm: [
        { i: 'title-section', x: 0, y: 0, w: 12, h: 1 },
        { i: 'key-metrics', x: 0, y: 1, w: 12, h: 2 },
        { i: 'main-chart', x: 0, y: 3, w: 12, h: 5 },
        { i: 'insights', x: 0, y: 8, w: 12, h: 5 },
        { i: 'action-items', x: 0, y: 13, w: 12, h: 2 }
      ],
      xs: [
        { i: 'title-section', x: 0, y: 0, w: 12, h: 1 },
        { i: 'key-metrics', x: 0, y: 1, w: 12, h: 2 },
        { i: 'main-chart', x: 0, y: 3, w: 12, h: 5 },
        { i: 'insights', x: 0, y: 8, w: 12, h: 5 },
        { i: 'action-items', x: 0, y: 13, w: 12, h: 2 }
      ]
    }
  }
];

export interface LayoutTemplateSelectorProps {
  onSelectTemplate: (template: LayoutTemplate) => void;
  currentCategory?: string;
}

export function LayoutTemplateSelector({ onSelectTemplate, currentCategory }: LayoutTemplateSelectorProps) {
  const filteredTemplates = currentCategory
    ? layoutTemplates.filter(t => t.category === currentCategory)
    : layoutTemplates;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredTemplates.map((template) => (
        <div
          key={template.id}
          className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onSelectTemplate(template)}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{template.preview}</span>
            <div>
              <h3 className="font-medium text-foreground">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground capitalize">
            {template.category}
          </div>
        </div>
      ))}
    </div>
  );
}