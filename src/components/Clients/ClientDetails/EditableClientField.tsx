import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useClientFieldUpdate, FINANCIAL_FRAMEWORK_OPTIONS, getFinancialFrameworkDisplayText } from '@/hooks/useClientFieldUpdate';
import { FinancialFrameworkType } from '@/types/client-extended';

interface EditableClientFieldProps {
  clientId: string;
  field: string;
  value: any;
  displayValue?: string;
  type: 'text' | 'select' | 'boolean';
  options?: Array<{ value: string; label: string; }>;
  placeholder?: string;
  className?: string;
}

const EditableClientField = ({
  clientId,
  field,
  value,
  displayValue,
  type,
  options = [],
  placeholder,
  className = "",
}: EditableClientFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const updateField = useClientFieldUpdate();

  // Use appropriate options based on field type
  const fieldOptions = field === 'financial_framework' ? FINANCIAL_FRAMEWORK_OPTIONS : options;

  const handleSave = () => {
    if (type === 'boolean') {
      updateField.mutate(
        { clientId, field, value: editValue },
        {
          onSuccess: () => setIsEditing(false),
        }
      );
    } else if (editValue !== value) {
      updateField.mutate(
        { clientId, field, value: editValue },
        {
          onSuccess: () => setIsEditing(false),
        }
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const getDisplayValue = () => {
    if (displayValue) return displayValue;
    
    if (type === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'JA' : 'NEI'}
        </Badge>
      );
    }
    
    if (field === 'financial_framework') {
      return getFinancialFrameworkDisplayText(value as FinancialFrameworkType);
    }
    
    return value || 'Ikke angitt';
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {type === 'text' && (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
        )}
        
        {type === 'select' && (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Velg..." />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {fieldOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {type === 'boolean' && (
          <div className="flex items-center gap-2">
            <Switch
              checked={editValue}
              onCheckedChange={setEditValue}
            />
            <span className="text-sm">{editValue ? 'JA' : 'NEI'}</span>
          </div>
        )}
        
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateField.isPending}
          className="px-2"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={updateField.isPending}
          className="px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between group ${className}`}>
      <div className="flex-1">
        {getDisplayValue()}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setEditValue(value || '');
          setIsEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity px-2"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default EditableClientField;