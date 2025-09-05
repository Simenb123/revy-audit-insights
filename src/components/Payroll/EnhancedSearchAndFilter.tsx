import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  X,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export interface FilterOptions {
  searchTerm: string;
  accountTypes: string[];
  mappingStatus: string[];
  discrepancyRange: [number, number];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showOnlyProblems: boolean;
}

interface EnhancedSearchAndFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  accountTypes: Array<{ value: string; label: string; count: number }>;
  totalRecords: number;
  filteredRecords: number;
}

const EnhancedSearchAndFilter: React.FC<EnhancedSearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  accountTypes,
  totalRecords,
  filteredRecords
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      accountTypes: [],
      mappingStatus: [],
      discrepancyRange: [0, 100000],
      sortBy: 'account_number',
      sortOrder: 'asc',
      showOnlyProblems: false
    });
  };

  const activeFilterCount = [
    filters.accountTypes.length > 0,
    filters.mappingStatus.length > 0,
    filters.discrepancyRange[0] > 0 || filters.discrepancyRange[1] < 100000,
    filters.showOnlyProblems
  ].filter(Boolean).length;

  const mappingStatusOptions = [
    { value: 'mapped', label: 'Mappet', icon: CheckCircle, color: 'text-green-600' },
    { value: 'unmapped', label: 'Ikke mappet', icon: Clock, color: 'text-yellow-600' },
    { value: 'suggested', label: 'Har forslag', icon: AlertTriangle, color: 'text-blue-600' }
  ];

  const sortOptions = [
    { value: 'account_number', label: 'Kontonummer' },
    { value: 'account_name', label: 'Kontonavn' },
    { value: 'amount', label: 'Beløp' },
    { value: 'discrepancy', label: 'Avvik' },
    { value: 'confidence', label: 'Sikkerhet' }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk på kontonummer, navn, eller beløp..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Problem Filter */}
          <Button
            variant={filters.showOnlyProblems ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange('showOnlyProblems', !filters.showOnlyProblems)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Kun problemer
          </Button>

          {/* Advanced Filters */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Avanserte filtre</h4>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Fjern alle
                  </Button>
                </div>

                {/* Account Types */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Kontotyper</label>
                  <div className="space-y-2">
                    {accountTypes.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.value}
                          checked={filters.accountTypes.includes(type.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange('accountTypes', [...filters.accountTypes, type.value]);
                            } else {
                              handleFilterChange('accountTypes', filters.accountTypes.filter(t => t !== type.value));
                            }
                          }}
                        />
                        <label htmlFor={type.value} className="text-sm flex-1">
                          {type.label}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {type.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mapping Status */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Mapping status</label>
                  <div className="space-y-2">
                    {mappingStatusOptions.map((status) => {
                      const Icon = status.icon;
                      return (
                        <div key={status.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={status.value}
                            checked={filters.mappingStatus.includes(status.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleFilterChange('mappingStatus', [...filters.mappingStatus, status.value]);
                              } else {
                                handleFilterChange('mappingStatus', filters.mappingStatus.filter(s => s !== status.value));
                              }
                            }}
                          />
                          <Icon className={`h-4 w-4 ${status.color}`} />
                          <label htmlFor={status.value} className="text-sm flex-1">
                            {status.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Discrepancy Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Avviksområde: {filters.discrepancyRange[0].toLocaleString()} - {filters.discrepancyRange[1].toLocaleString()} kr
                  </label>
                  <Slider
                    value={filters.discrepancyRange}
                    onValueChange={(value) => handleFilterChange('discrepancyRange', value as [number, number])}
                    max={100000}
                    step={1000}
                    className="mt-2"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort Controls */}
          <div className="flex items-center gap-1">
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {filters.sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        {(filters.searchTerm || activeFilterCount > 0) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Viser {filteredRecords.toLocaleString()} av {totalRecords.toLocaleString()} poster
            </span>
            
            {filters.searchTerm && (
              <Badge variant="outline">
                Søk: "{filters.searchTerm}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => handleFilterChange('searchTerm', '')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filters.accountTypes.map((type) => (
              <Badge key={type} variant="outline">
                Type: {accountTypes.find(t => t.value === type)?.label || type}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => handleFilterChange('accountTypes', filters.accountTypes.filter(t => t !== type))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            
            {filters.mappingStatus.map((status) => (
              <Badge key={status} variant="outline">
                Status: {mappingStatusOptions.find(s => s.value === status)?.label || status}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => handleFilterChange('mappingStatus', filters.mappingStatus.filter(s => s !== status))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedSearchAndFilter;