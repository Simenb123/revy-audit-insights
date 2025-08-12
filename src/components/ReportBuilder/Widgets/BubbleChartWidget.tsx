import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface BubbleChartWidgetProps {
  widget: Widget;
}

export function BubbleChartWidget({ widget }: BubbleChartWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const data = widget.config?.data || [
    { x: 10, y: 30, z: 200 },
    { x: 20, y: 50, z: 100 },
    { x: 30, y: 70, z: 300 }
  ];
  const color = widget.config?.color || '#3b82f6';

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis dataKey="x" />
            <YAxis dataKey="y" />
            <ZAxis dataKey="z" range={[50, 400]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} fill={color} />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
