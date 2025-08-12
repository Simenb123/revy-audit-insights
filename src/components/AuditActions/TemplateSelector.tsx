import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TemplateSelectorProps {
  templates: any[];
  value?: string;
  onChange: (value: string) => void;
  onTemplateSelected?: (template: any | undefined) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, value, onChange, onTemplateSelected }) => {
  return (
    <div className="space-y-2">
      <Label>Arbeidspapir-mal</Label>
      <Select
        value={value}
        onValueChange={(val) => {
          onChange(val);
          const tpl = templates.find((t: any) => t.id === val);
          onTemplateSelected?.(tpl);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Velg mal (filtrert på fagområde og type)" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t: any) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TemplateSelector;
