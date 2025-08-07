import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';

interface TextWidgetProps {
  widget: Widget;
}

export function TextWidget({ widget }: TextWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const content = widget.config?.content || 'Dette er en tekstwidget. Klikk for å redigere innhold.';
  const fontSize = widget.config?.fontSize || 'sm';

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  const fontSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm', 
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const fontSizeClass = fontSizeMap[fontSize as keyof typeof fontSizeMap] || 'text-sm';

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle 
          title={widget.title} 
          onTitleChange={handleTitleChange}
          size="sm"
        />
      </CardHeader>
      <CardContent>
        <div className={`${fontSizeClass} text-muted-foreground whitespace-pre-wrap`}>
          {content}
        </div>
      </CardContent>
    </Card>
  );
}