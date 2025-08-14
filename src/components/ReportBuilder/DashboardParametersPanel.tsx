import React, { useState } from 'react';
import { useDashboardInteractions, DashboardParameter } from './DashboardInteractions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, X, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardParametersPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface ParameterFormProps {
  onAdd: (parameter: DashboardParameter) => void;
  onCancel: () => void;
}

function ParameterForm({ onAdd, onCancel }: ParameterFormProps) {
  const [formData, setFormData] = useState<Partial<DashboardParameter>>({
    type: 'string',
    required: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.type) {
      onAdd({
        id: `param_${Date.now()}`,
        name: formData.name,
        type: formData.type as any,
        value: getDefaultValue(formData.type as any),
        options: formData.options,
        required: formData.required
      });
      setFormData({ type: 'string', required: false });
    }
  };

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'number': return 0;
      case 'boolean': return false;
      case 'date': return new Date();
      default: return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <Label htmlFor="param-name">Parameter Name</Label>
        <Input
          id="param-name"
          value={formData.name || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter parameter name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="param-type">Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="boolean">Yes/No</SelectItem>
            <SelectItem value="select">Dropdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.type === 'select' && (
        <div className="space-y-2">
          <Label>Options (comma separated)</Label>
          <Input
            placeholder="Option 1, Option 2, Option 3"
            onChange={(e) => {
              const options = e.target.value.split(',').map(o => o.trim()).filter(Boolean);
              setFormData(prev => ({ ...prev, options }));
            }}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="required"
          checked={formData.required}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
        />
        <Label htmlFor="required">Required</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">Add Parameter</Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function ParameterControl({ parameter }: { parameter: DashboardParameter }) {
  const { setParameter } = useDashboardInteractions();

  const handleValueChange = (value: any) => {
    setParameter(parameter.id, value);
  };

  switch (parameter.type) {
    case 'string':
      return (
        <Input
          value={parameter.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={`Enter ${parameter.name.toLowerCase()}`}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={parameter.value || 0}
          onChange={(e) => handleValueChange(Number(e.target.value))}
        />
      );

    case 'boolean':
      return (
        <Switch
          checked={parameter.value || false}
          onCheckedChange={handleValueChange}
        />
      );

    case 'date':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('w-full justify-start text-left font-normal')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {parameter.value ? format(new Date(parameter.value), 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={parameter.value ? new Date(parameter.value) : undefined}
              onSelect={(date) => handleValueChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );

    case 'select':
      return (
        <Select value={parameter.value} onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${parameter.name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {parameter.options?.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return null;
  }
}

export function DashboardParametersPanel({ isOpen, onToggle, className }: DashboardParametersPanelProps) {
  const { parameters, removeParameter, addParameter } = useDashboardInteractions();
  const [showForm, setShowForm] = useState(false);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={cn('fixed top-4 right-4 z-40', className)}
      >
        <Settings className="w-4 h-4 mr-2" />
        Parameters ({parameters.length})
      </Button>
    );
  }

  return (
    <div className={cn('fixed top-4 right-4 w-80 max-h-[80vh] overflow-y-auto bg-background border rounded-lg shadow-lg z-40', className)}>
      <div className="sticky top-0 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Dashboard Parameters</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Global parameters that affect all widgets
        </p>
      </div>

      <div className="p-4 space-y-4">
        {parameters.length === 0 && !showForm && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No parameters defined yet
            </p>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </div>
        )}

        {parameters.map((parameter) => (
          <div key={parameter.id} className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="font-medium">{parameter.name}</Label>
                {parameter.required && (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeParameter(parameter.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <ParameterControl parameter={parameter} />
          </div>
        ))}

        {showForm && (
          <ParameterForm
            onAdd={(param) => {
              addParameter(param);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {parameters.length > 0 && !showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Parameter
          </Button>
        )}
      </div>
    </div>
  );
}