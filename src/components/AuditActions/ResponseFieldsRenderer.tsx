import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ResponseField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'checkbox_group';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface ResponseFieldsRendererProps {
  fields: ResponseField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
}

export const ResponseFieldsRenderer: React.FC<ResponseFieldsRendererProps> = ({
  fields,
  values,
  onChange,
  errors = {}
}) => {
  if (!fields || fields.length === 0) {
    return null;
  }

  const renderField = (field: ResponseField) => {
    const value = values[field.id];
    const error = errors[field.id];
    const hasError = !!error;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value || ''}
              onValueChange={(val) => onChange(field.id, val)}
            >
              <SelectTrigger id={field.id} className={hasError ? 'border-destructive' : ''}>
                <SelectValue placeholder="Velg..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.id}
                checked={!!value}
                onCheckedChange={(checked) => onChange(field.id, checked)}
              />
              <Label htmlFor={field.id} className="cursor-pointer">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {hasError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );

      case 'checkbox_group':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2 pl-1">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, option]
                        : selectedValues.filter((v) => v !== option);
                      onChange(field.id, newValues);
                    }}
                  />
                  <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {hasError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">Resultatfelter</h3>
          <p className="text-xs text-muted-foreground">
            Fyll ut feltene nedenfor basert på utført arbeid
          </p>
        </div>
        <div className="space-y-4">
          {fields.map((field) => renderField(field))}
        </div>
      </div>
    </Card>
  );
};

export default ResponseFieldsRenderer;
