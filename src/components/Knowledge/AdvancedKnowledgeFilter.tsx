
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, X } from 'lucide-react';

interface FilterState {
  searchTerm: string;
  contentTypes: string[];
  subjectAreas: string[];
}

interface AdvancedKnowledgeFilterProps {
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

const AdvancedKnowledgeFilter = ({ onFilterChange, className }: AdvancedKnowledgeFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    contentTypes: [],
    subjectAreas: []
  });

  const { data: contentTypes } = useQuery({
    queryKey: ['content-types-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: subjectAreas } = useQuery({
    queryKey: ['subject-areas-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_areas')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const toggleContentType = (typeId: string) => {
    const newTypes = filters.contentTypes.includes(typeId)
      ? filters.contentTypes.filter(id => id !== typeId)
      : [...filters.contentTypes, typeId];
    
    updateFilters({ contentTypes: newTypes });
  };

  const toggleSubjectArea = (areaId: string) => {
    const newAreas = filters.subjectAreas.includes(areaId)
      ? filters.subjectAreas.filter(id => id !== areaId)
      : [...filters.subjectAreas, areaId];
    
    updateFilters({ subjectAreas: newAreas });
  };

  const clearFilters = () => {
    updateFilters({
      searchTerm: '',
      contentTypes: [],
      subjectAreas: []
    });
  };

  const hasActiveFilters = filters.searchTerm || filters.contentTypes.length > 0 || filters.subjectAreas.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Avansert filtrering
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Nullstill
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Søk</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Søk i tittel, innhold eller tags..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        {/* Content Types */}
        <div className="space-y-3">
          <Label>Innholdstyper</Label>
          <div className="space-y-2">
            {contentTypes?.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.id}`}
                  checked={filters.contentTypes.includes(type.id)}
                  onCheckedChange={() => toggleContentType(type.id)}
                />
                <Label
                  htmlFor={`type-${type.id}`}
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: type.color }}
                  />
                  {type.display_name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Subject Areas */}
        <div className="space-y-3">
          <Label>Emneområder</Label>
          <div className="space-y-2">
            {subjectAreas?.map((area) => (
              <div key={area.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`area-${area.id}`}
                  checked={filters.subjectAreas.includes(area.id)}
                  onCheckedChange={() => toggleSubjectArea(area.id)}
                />
                <Label
                  htmlFor={`area-${area.id}`}
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: area.color }}
                  />
                  {area.display_name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Aktive filtre</Label>
              <div className="flex flex-wrap gap-2">
                {filters.searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Søk: {filters.searchTerm}
                  </Badge>
                )}
                {filters.contentTypes.map(typeId => {
                  const type = contentTypes?.find(t => t.id === typeId);
                  return type ? (
                    <Badge key={typeId} variant="secondary" className="text-xs">
                      Type: {type.display_name}
                    </Badge>
                  ) : null;
                })}
                {filters.subjectAreas.map(areaId => {
                  const area = subjectAreas?.find(a => a.id === areaId);
                  return area ? (
                    <Badge key={areaId} variant="secondary" className="text-xs">
                      Emne: {area.display_name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedKnowledgeFilter;
