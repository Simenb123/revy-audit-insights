import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { useFilters } from '@/contexts/FilterContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Search, Filter, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterWidgetProps {
  widget: Widget;
}

export function FilterWidget({ widget }: FilterWidgetProps) {
  const { filters, updateFilter, clearFilter, clearFilters, clearCrossFilter, isCrossFiltered } = useFilters();
  const config = widget.config || {};

  const showDateRange = config.showDateRange !== false;
  const showAccountCategory = config.showAccountCategory !== false;
  const showAccountType = config.showAccountType !== false;
  const showSearch = config.showSearch !== false;

  const accountCategories = [
    { value: 'asset', label: 'Eiendeler' },
    { value: 'liability', label: 'Gjeld' },
    { value: 'equity', label: 'Egenkapital' },
    { value: 'revenue', label: 'Inntekt' },
    { value: 'expense', label: 'Kostnad' },
  ];

  const accountTypes = [
    { value: 'current_asset', label: 'Omløpsmidler' },
    { value: 'fixed_asset', label: 'Anleggsmidler' },
    { value: 'current_liability', label: 'Kortsiktig gjeld' },
    { value: 'long_term_liability', label: 'Langsiktig gjeld' },
    { value: 'operating_revenue', label: 'Driftsinntekt' },
    { value: 'operating_expense', label: 'Driftskostnad' },
  ];

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4" />
          {widget.title}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearFilters();
                clearCrossFilter();
              }}
              className="h-auto p-1 text-xs hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3 w-3" />
              Fjern alle
            </Button>
          )}
        </CardTitle>
        
        {/* Cross-filter indicator */}
        {isCrossFiltered && filters.crossFilter && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
            <Target className="h-3 w-3" />
            <span>Kryssfilter: {filters.crossFilter.label}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCrossFilter}
              className="h-auto p-0.5 ml-1 hover:bg-primary/20"
            >
              <X className="h-2 w-2" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showSearch && (
          <div className="space-y-1">
            <Label htmlFor="filter-search" className="text-xs font-medium">
              Søk i kontonavn
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="filter-search"
                placeholder="Søk..."
                value={filters.searchTerm || ''}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-8 h-9"
              />
              {filters.searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('searchTerm')}
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {showAccountCategory && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">Kontokategori</Label>
            <Select 
              value={filters.accountCategory || ''} 
              onValueChange={(value) => updateFilter('accountCategory', value || undefined)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Alle kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle kategorier</SelectItem>
                {accountCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showAccountType && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">Kontotype</Label>
            <Select 
              value={filters.accountType || ''} 
              onValueChange={(value) => updateFilter('accountType', value || undefined)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Alle typer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle typer</SelectItem>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showDateRange && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Datoperiode</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="date-start" className="text-xs text-muted-foreground">Fra</Label>
                <Input
                  id="date-start"
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => updateFilter('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="date-end" className="text-xs text-muted-foreground">Til</Label>
                <Input
                  id="date-end"
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => updateFilter('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}