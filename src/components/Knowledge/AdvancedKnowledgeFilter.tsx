
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

// Temporary interfaces until database is updated
import type { ContentType, SubjectArea } from '@/types/classification';

const AdvancedKnowledgeFilter = ({ onFilterChange, className }: AdvancedKnowledgeFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    contentTypes: [],
    subjectAreas: []
  });

  // Temporary hardcoded data until database tables are created
  const contentTypes: ContentType[] = [
    { id: '1', name: 'fagartikkel', display_name: 'Fagartikkel', color: '#3B82F6', icon: 'file-text' },
    { id: '2', name: 'lov', display_name: 'Lov', color: '#10B981', icon: 'scale' },
    { id: '3', name: 'isa-standard', display_name: 'ISA-standard', color: '#8B5CF6', icon: 'file-code' },
    { id: '4', name: 'nrs-standard', display_name: 'NRS-standard', color: '#6366F1', icon: 'book' },
    { id: '5', name: 'forskrift', display_name: 'Forskrift', color: '#F59E0B', icon: 'gavel' },
    { id: '6', name: 'forarbeider', display_name: 'Forarbeider', color: '#6B7280', icon: 'file-text' },
    { id: '7', name: 'dom', display_name: 'Dom', color: '#EF4444', icon: 'scale' }
  ];

  const subjectAreas: SubjectArea[] = [
    { id: '1', name: 'revisjon', display_name: 'Revisjon', color: '#3B82F6', icon: 'shield-check' },
    { id: '2', name: 'regnskap', display_name: 'Regnskap', color: '#10B981', icon: 'calculator' },
    { id: '3', name: 'skatt', display_name: 'Skatt', color: '#F59E0B', icon: 'coins' },
    { id: '4', name: 'annet', display_name: 'Annet', color: '#6B7280', icon: 'folder' }
  ];

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
            {contentTypes.map((type) => (
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
            {subjectAreas.map((area) => (
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
                  const type = contentTypes.find(t => t.id === typeId);
                  return type ? (
                    <Badge key={typeId} variant="secondary" className="text-xs">
                      Type: {type.display_name}
                    </Badge>
                  ) : null;
                })}
                {filters.subjectAreas.map(areaId => {
                  const area = subjectAreas.find(a => a.id === areaId);
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
