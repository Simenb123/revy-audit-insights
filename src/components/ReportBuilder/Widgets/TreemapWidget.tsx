import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface TreemapWidgetProps {
  widget: Widget;
}

export function TreemapWidget({ widget }: TreemapWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const data = widget.config?.data || [
    { name: 'A', size: 400 },
    { name: 'B', size: 300 },
    { name: 'C', size: 300 },
    { name: 'D', size: 200 }
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
          <Treemap data={data} dataKey="size" stroke="#fff" fill={color}>
            <Tooltip />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
