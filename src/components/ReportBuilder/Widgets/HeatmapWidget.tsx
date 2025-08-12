import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';

interface HeatmapWidgetProps {
  widget: Widget;
}

export function HeatmapWidget({ widget }: HeatmapWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const data = widget.config?.data || [
    { x: 'A', y: '1', value: 10 },
    { x: 'B', y: '1', value: 30 },
    { x: 'A', y: '2', value: 20 },
    { x: 'B', y: '2', value: 40 }
  ];

  const xValues = Array.from(new Set(data.map(d => d.x)));
  const yValues = Array.from(new Set(data.map(d => d.y)));
  const max = Math.max(...data.map(d => d.value), 0);

  const getColor = (value: number) => {
    const scale = widget.config?.colorScale || 'blue';
    const intensity = max === 0 ? 0 : value / max;
    const colors: Record<string, string> = {
      blue: `rgba(59,130,246,${intensity})`,
      red: `rgba(239,68,68,${intensity})`,
      green: `rgba(34,197,94,${intensity})`
    };
    return colors[scale] || colors.blue;
  };

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
      </CardHeader>
      <CardContent className="overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${xValues.length}, minmax(20px,1fr))` }}>
          {yValues.map(y =>
            xValues.map(x => {
              const cell = data.find(d => d.x === x && d.y === y);
              const value = cell ? cell.value : 0;
              return (
                <div
                  key={`${x}-${y}`}
                  className="aspect-square"
                  style={{ backgroundColor: getColor(value) }}
                  title={`${x},${y}: ${value}`}
                />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
