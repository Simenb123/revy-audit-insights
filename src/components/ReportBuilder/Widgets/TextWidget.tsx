import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TextWidgetProps {
  widget: Widget;
}

export function TextWidget({ widget }: TextWidgetProps) {
  const content = widget.config?.content || 'Dette er en tekstwidget. Klikk for å redigere innhold.';
  const fontSize = widget.config?.fontSize || 'sm';

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
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizeClass} text-muted-foreground whitespace-pre-wrap`}>
          {content}
        </div>
      </CardContent>
    </Card>
  );
}