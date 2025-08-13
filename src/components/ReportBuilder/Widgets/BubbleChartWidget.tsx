import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useBubbleData } from '@/hooks/useBubbleData';

interface BubbleChartWidgetProps {
  widget: Widget;
}

export function BubbleChartWidget({ widget }: BubbleChartWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId as string | undefined;
  const { data = [] } = useBubbleData(clientId);
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
        {data.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ingen boblediagram-data.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <ZAxis dataKey="z" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill={color} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
