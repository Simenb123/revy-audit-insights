import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Plus, Save, Trash2 } from 'lucide-react';
import type { ClientFilterField, ClientFilterConfig, ClientFilter } from '@/types/client-extended';

interface ClientFiltersProps {
  activeFilters: ClientFilterField[];
  onFiltersChange: (filters: ClientFilterField[]) => void;
  availableFields: Array<{
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'select';
    options?: string[];
  }>;
  savedFilters?: ClientFilter[];
  onSaveFilter?: (name: string, config: ClientFilterConfig) => void;
  onLoadFilter?: (filter: ClientFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
}

const OPERATORS = {
  string: [
    { value: 'equals', label: 'Er lik' },
    { value: 'contains', label: 'Inneholder' },
    { value: 'starts_with', label: 'Starter med' },
    { value: 'ends_with', label: 'Slutter med' },
    { value: 'is_null', label: 'Er tom' },
    { value: 'is_not_null', label: 'Er ikke tom' },
  ],
  number: [
    { value: 'equals', label: 'Er lik' },
    { value: 'gt', label: 'Større enn' },
    { value: 'gte', label: 'Større eller lik' },
    { value: 'lt', label: 'Mindre enn' },
    { value: 'lte', label: 'Mindre eller lik' },
    { value: 'is_null', label: 'Er tom' },
    { value: 'is_not_null', label: 'Er ikke tom' },
  ],
  date: [
    { value: 'equals', label: 'Er lik' },
    { value: 'gt', label: 'Etter' },
    { value: 'gte', label: 'Etter eller lik' },
    { value: 'lt', label: 'Før' },
    { value: 'lte', label: 'Før eller lik' },
    { value: 'is_null', label: 'Er tom' },
    { value: 'is_not_null', label: 'Er ikke tom' },
  ],
  select: [
    { value: 'equals', label: 'Er lik' },
    { value: 'in', label: 'Er en av' },
    { value: 'not_in', label: 'Er ikke en av' },
    { value: 'is_null', label: 'Er tom' },
    { value: 'is_not_null', label: 'Er ikke tom' },
  ],
};

const ClientFilters: React.FC<ClientFiltersProps> = ({
  activeFilters,
  onFiltersChange,
  availableFields,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<ClientFilterField>>({});
  const [saveFilterName, setSaveFilterName] = useState('');

  const addFilter = () => {
    if (newFilter.field && newFilter.operator) {
      const filter: ClientFilterField = {
        field: newFilter.field,
        operator: newFilter.operator as any,
        value: newFilter.value || '',
        type: newFilter.type || 'string',
      };
      onFiltersChange([...activeFilters, filter]);
      setNewFilter({});
    }
  };

  const removeFilter = (index: number) => {
    const updated = activeFilters.filter((_, i) => i !== index);
    onFiltersChange(updated);
  };

  const updateFilter = (index: number, updates: Partial<ClientFilterField>) => {
    const updated = activeFilters.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    );
    onFiltersChange(updated);
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const saveCurrentFilters = () => {
    if (saveFilterName && onSaveFilter && activeFilters.length > 0) {
      const config: ClientFilterConfig = {
        fields: activeFilters,
        logic: 'AND',
      };
      onSaveFilter(saveFilterName, config);
      setSaveFilterName('');
    }
  };

  const getFieldInfo = (fieldKey: string) => {
    return availableFields.find(f => f.key === fieldKey);
  };

  const renderFilterValue = (filter: ClientFilterField, index: number) => {
    const fieldInfo = getFieldInfo(filter.field);
    
    // No value needed for null checks
    if (filter.operator === 'is_null' || filter.operator === 'is_not_null') {
      return null;
    }

    if (fieldInfo?.type === 'select' && fieldInfo.options) {
      return (
        <Select
          value={filter.value}
          onValueChange={(value) => updateFilter(index, { value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Velg verdi" />
          </SelectTrigger>
          <SelectContent>
            {fieldInfo.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    const inputType = fieldInfo?.type === 'number' ? 'number' : 
                     fieldInfo?.type === 'date' ? 'date' : 'text';

    return (
      <Input
        type={inputType}
        value={filter.value}
        onChange={(e) => updateFilter(index, { value: e.target.value })}
        placeholder="Verdi"
        className="w-40"
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Aktive filtre</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Fjern alle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeFilters.map((filter, index) => {
              const fieldInfo = getFieldInfo(filter.field);
              const operator = OPERATORS[filter.type as keyof typeof OPERATORS]?.find(
                op => op.value === filter.operator
              );

              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <Badge variant="secondary" className="text-xs">
                    {fieldInfo?.label || filter.field}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {operator?.label || filter.operator}
                  </span>
                  {filter.operator !== 'is_null' && filter.operator !== 'is_not_null' && (
                    <Badge variant="outline" className="text-xs">
                      {filter.value}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(index)}
                    className="h-6 w-6 p-0 ml-auto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Legg til filter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Legg til filter</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="field">Felt</Label>
                <Select
                  value={newFilter.field}
                  onValueChange={(value) => {
                    const fieldInfo = getFieldInfo(value);
                    setNewFilter({
                      field: value,
                      type: fieldInfo?.type || 'string',
                      operator: undefined,
                      value: ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg felt" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newFilter.field && (
                <div>
                  <Label htmlFor="operator">Operator</Label>
                  <Select
                    value={newFilter.operator}
                    onValueChange={(value) => setNewFilter(prev => ({ ...prev, operator: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS[newFilter.type as keyof typeof OPERATORS]?.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newFilter.field && newFilter.operator && 
               newFilter.operator !== 'is_null' && newFilter.operator !== 'is_not_null' && (
                <div>
                  <Label htmlFor="value">Verdi</Label>
                  {(() => {
                    const fieldInfo = getFieldInfo(newFilter.field!);
                    if (fieldInfo?.type === 'select' && fieldInfo.options) {
                      return (
                        <Select
                          value={newFilter.value}
                          onValueChange={(value) => setNewFilter(prev => ({ ...prev, value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg verdi" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldInfo.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }

                    const inputType = fieldInfo?.type === 'number' ? 'number' : 
                                     fieldInfo?.type === 'date' ? 'date' : 'text';

                    return (
                      <Input
                        type={inputType}
                        value={newFilter.value || ''}
                        onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="Skriv inn verdi"
                      />
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setNewFilter({});
                  }}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={() => {
                    addFilter();
                    setIsDialogOpen(false);
                  }}
                  disabled={!newFilter.field || !newFilter.operator}
                >
                  Legg til
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save Filter */}
        {activeFilters.length > 0 && onSaveFilter && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Navn på filter"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              className="w-40"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={saveCurrentFilters}
              disabled={!saveFilterName}
            >
              <Save className="mr-1 h-4 w-4" />
              Lagre
            </Button>
          </div>
        )}

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <Select onValueChange={(value) => {
            const filter = savedFilters.find(f => f.id === value);
            if (filter && onLoadFilter) {
              onLoadFilter(filter);
            }
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Last lagret filter" />
            </SelectTrigger>
            <SelectContent>
              {savedFilters.map((filter) => (
                <SelectItem key={filter.id} value={filter.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{filter.filter_name}</span>
                    {onDeleteFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFilter(filter.id);
                        }}
                        className="h-4 w-4 p-0 ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default ClientFilters;