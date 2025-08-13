import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useTreemapData } from '@/hooks/useTreemapData';

interface TreemapWidgetProps {
  widget: Widget;
}

export function TreemapWidget({ widget }: TreemapWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId as string | undefined;
  const { data = [] } = useTreemapData(clientId);
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
          <div className="text-sm text-muted-foreground">
            Ingen treemap-data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap data={data} dataKey="size" stroke="#fff" fill={color}>
              <Tooltip />
            </Treemap>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
