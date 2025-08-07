import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FilterWidgetConfigProps {
  widget: Widget;
  onConfigChange: (config: Record<string, any>) => void;
}

export function FilterWidgetConfig({ widget, onConfigChange }: FilterWidgetConfigProps) {
  const config = widget.config || {};

  const handleConfigUpdate = (key: string, value: any) => {
    onConfigChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="show-search">Vis søkefelt</Label>
        <Switch
          id="show-search"
          checked={config.showSearch !== false}
          onCheckedChange={(checked) => handleConfigUpdate('showSearch', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-category">Vis kontokategori-filter</Label>
        <Switch
          id="show-category"
          checked={config.showAccountCategory !== false}
          onCheckedChange={(checked) => handleConfigUpdate('showAccountCategory', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-type">Vis kontotype-filter</Label>
        <Switch
          id="show-type"
          checked={config.showAccountType !== false}
          onCheckedChange={(checked) => handleConfigUpdate('showAccountType', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-date">Vis datofilter</Label>
        <Switch
          id="show-date"
          checked={config.showDateRange !== false}
          onCheckedChange={(checked) => handleConfigUpdate('showDateRange', checked)}
        />
      </div>
    </div>
  );
}