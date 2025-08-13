import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type WaterfallItem = { name: string; value: number; start?: number; end?: number };

interface WaterfallWidgetProps {
  widget: Widget;
}

export function WaterfallWidget({ widget }: WaterfallWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const rawData: WaterfallItem[] = widget.config?.data || [
    { name: 'Start', value: 1000 },
    { name: 'Inntekt', value: 400 },
    { name: 'Kostnad', value: -300 },
    { name: 'Slutt', value: 1100 },
  ];

  const data: WaterfallItem[] = rawData.reduce<WaterfallItem[]>((acc, item) => {
    const prev = acc.length > 0 ? (acc[acc.length - 1].end || 0) : 0;
    const end = prev + item.value;
    acc.push({ ...item, start: prev, end });
    return acc;
  }, []);

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
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="start" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a">
                {data.map((entry: WaterfallItem, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#4ade80' : '#f87171'} />
                ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
