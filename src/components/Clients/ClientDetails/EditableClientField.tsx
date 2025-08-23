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
import { Edit2, Check, X, AlertTriangle, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useClientFieldUpdate, FINANCIAL_FRAMEWORK_OPTIONS, getFinancialFrameworkDisplayText } from '@/hooks/useClientFieldUpdate';
import { FinancialFrameworkType } from '@/types/client-extended';
import { cn } from '@/lib/utils';

interface EditableClientFieldProps {
  clientId: string;
  field: string;
  value: any;
  displayValue?: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  options?: Array<{ value: string; label: string; }>;
  placeholder?: string;
  className?: string;
  hasWarning?: boolean;
  warningMessage?: string;
  isEmpty?: boolean;
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
  hasWarning = false,
  warningMessage,
  isEmpty = false,
}: EditableClientFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const updateField = useClientFieldUpdate();

  // Use appropriate options based on field type
  const fieldOptions = field === 'financial_framework' ? FINANCIAL_FRAMEWORK_OPTIONS : options;

  const handleSave = (newValue?: any) => {
    const valueToSave = newValue !== undefined ? newValue : editValue;
    
    if (type === 'boolean' || newValue !== undefined) {
      updateField.mutate(
        { clientId, field, value: valueToSave },
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
    
    if (field === 'financial_framework') {
      return getFinancialFrameworkDisplayText(value as FinancialFrameworkType);
    }
    
    return value || 'Ikke angitt';
  };

  const getStatusColor = () => {
    if (isEmpty) return 'text-destructive';
    if (hasWarning) return 'text-warning';
    return 'text-foreground';
  };

  const getBackgroundColor = () => {
    if (isEmpty) return 'bg-destructive/5 border-destructive/20';
    if (hasWarning) return 'bg-warning/5 border-warning/20';
    return 'bg-background border-border';
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {(type === 'text' || type === 'number') && (
          <Input
            type={type === 'number' ? 'number' : 'text'}
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
    <TooltipProvider>
      <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${getBackgroundColor()} ${className}`}>
        <div className="flex items-center gap-2 flex-1">
          {type === 'boolean' ? (
            <Button
              onClick={() => handleSave(!value)}
              variant={value === true ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 px-3 text-xs font-medium transition-all duration-200",
                value === true 
                  ? "bg-success hover:bg-success/80 text-success-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              disabled={updateField.isPending}
            >
              {value === true ? 'JA' : 'NEI'}
            </Button>
          ) : (
            <div className={`transition-colors ${getStatusColor()}`}>
              {getDisplayValue()}
            </div>
          )}
          {hasWarning && warningMessage && (
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{warningMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {type === 'select' ? (
          <Select 
            value={value || ''} 
            onValueChange={(newValue) => {
              updateField.mutate({ clientId, field, value: newValue });
            }}
          >
            <SelectTrigger className="w-auto min-w-[120px] bg-transparent border-0 shadow-none">
              <ChevronDown className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {fieldOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'boolean' ? null : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditValue(value || '');
              setIsEditing(true);
            }}
            className="text-muted-foreground hover:text-foreground px-2"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
};

export default EditableClientField;