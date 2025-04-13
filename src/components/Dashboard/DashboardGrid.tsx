
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import AccountingOverview from './Widgets/AccountingOverview';
import FinancialRatios from './Widgets/FinancialRatios';
import RevenueAnalysis from './Widgets/RevenueAnalysis';
import ExpenseAnalysis from './Widgets/ExpenseAnalysis';
import RiskAssessment from './Widgets/RiskAssessment';
import ProjectCard from './Widgets/ProjectCard';

type WidgetKey = 'accountingOverview' | 'financialRatios' | 'revenueAnalysis' | 'expenseAnalysis' | 'riskAssessment' | 'projectCard';

const widgetComponents: Record<WidgetKey, React.FC<{className?: string}>> = {
  accountingOverview: AccountingOverview,
  financialRatios: FinancialRatios,
  revenueAnalysis: RevenueAnalysis,
  expenseAnalysis: ExpenseAnalysis,
  riskAssessment: RiskAssessment,
  projectCard: ProjectCard,
};

// Initial widget layout
const initialWidgets: { id: string; type: WidgetKey; col: number; row: number; colSpan: number; rowSpan: number }[] = [
  { id: '1', type: 'accountingOverview', col: 1, row: 1, colSpan: 2, rowSpan: 2 },
  { id: '2', type: 'financialRatios', col: 3, row: 1, colSpan: 1, rowSpan: 1 },
  { id: '3', type: 'revenueAnalysis', col: 1, row: 3, colSpan: 1, rowSpan: 1 },
  { id: '4', type: 'expenseAnalysis', col: 2, row: 3, colSpan: 1, rowSpan: 1 },
  { id: '5', type: 'riskAssessment', col: 3, row: 2, colSpan: 1, rowSpan: 2 },
  { id: '6', type: 'projectCard', col: 4, row: 1, colSpan: 1, rowSpan: 3 },
];

const DashboardGrid = () => {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const onDragStart = (e: React.MouseEvent, id: string) => {
    // Prevent default to allow drag
    e.preventDefault();
    
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    setDraggingId(id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
  };

  const renderWidgets = () => {
    return widgets.map((widget) => {
      const WidgetComponent = widgetComponents[widget.type];
      
      const gridStyle = {
        gridColumn: `${widget.col} / span ${widget.colSpan}`,
        gridRow: `${widget.row} / span ${widget.rowSpan}`,
      };
      
      return (
        <div
          key={widget.id}
          className={cn(
            "drag-handle rounded-lg border bg-card text-card-foreground shadow-md",
            draggingId === widget.id ? "z-50 ring-2 ring-primary" : ""
          )}
          style={gridStyle}
          onMouseDown={(e) => onDragStart(e, widget.id)}
          onMouseUp={onDragEnd}
        >
          <WidgetComponent className="h-full" />
        </div>
      );
    });
  };

  return (
    <div className="p-2">
      <div className="grid grid-cols-4 gap-4 auto-rows-min min-h-[600px]">
        {renderWidgets()}
      </div>
      
      {/* Dragging overlay - would be implemented with proper DnD library */}
      {draggingId && (
        <motion.div
          className="fixed pointer-events-none opacity-70 z-50 bg-white rounded-lg shadow-xl border border-primary"
          animate={{ 
            x: 0, 
            y: 0, 
            opacity: 0.8
          }}
        >
          {/* Widget shadow while dragging */}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardGrid;
