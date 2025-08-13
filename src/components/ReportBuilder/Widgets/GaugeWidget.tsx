import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { useGaugeData } from '@/hooks/useGaugeData';

interface GaugeWidgetProps {
  widget: Widget;
}

export function GaugeWidget({ widget }: GaugeWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId as string | undefined;
  const { data } = useGaugeData(clientId);
  const value = data?.value ?? Number(widget.config?.value ?? 0);
  const max = data?.max ?? Number(widget.config?.max ?? 100);
  const percentage = Math.min(Math.max(value / max, 0), 1) * 100;

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle
          title={widget.title}
          onTitleChange={handleTitleChange}
          size="sm"
        />
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <svg width="100" height="100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 0.3s' }}
          />
          <text
            x="50"
            y="55"
            textAnchor="middle"
            className="text-sm font-medium"
          >
            {Math.round(percentage)}%
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
