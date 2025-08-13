import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngExpression } from 'leaflet';

interface MapWidgetProps {
  widget: Widget;
}

export function MapWidget({ widget }: MapWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const center: LatLngExpression = (widget.config?.center as LatLngExpression) || [59.9139, 10.7522];
  const zoom: number = (widget.config?.zoom as number) || 13;

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
      </CardHeader>
      <CardContent className="h-[250px]">
        <MapContainer center={center} zoom={zoom} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </CardContent>
    </Card>
  );
}
