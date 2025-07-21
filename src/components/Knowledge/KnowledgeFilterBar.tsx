
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { KnowledgeCategory, ContentType, SubjectArea } from '@/types/knowledge';

interface KnowledgeFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange: (categoryId: string) => void;
  selectedContentType?: string;
  onContentTypeChange: (contentTypeId: string) => void;
  selectedSubjectAreas: string[];
  onSubjectAreaToggle: (subjectAreaId: string) => void;
  categories: KnowledgeCategory[];
  contentTypes: ContentType[];
  subjectAreas: SubjectArea[];
  onClearFilters: () => void;
}

const KnowledgeFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedContentType,
  onContentTypeChange,
  selectedSubjectAreas,
  onSubjectAreaToggle,
  categories,
  contentTypes,
  subjectAreas,
  onClearFilters
}: KnowledgeFilterBarProps) => {
  const hasActiveFilters = selectedCategory || selectedContentType || selectedSubjectAreas.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Søk i fagartikler..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters} size="sm">
            <X className="w-4 h-4 mr-2" />
            Fjern filtre
          </Button>
        )}
      </div>

      {/* Horizontal Filter Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtre:</span>
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory || ""} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle kategorier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle kategorier</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Content Type Filter */}
        <Select value={selectedContentType || ""} onValueChange={onContentTypeChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle typer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle typer</SelectItem>
            {contentTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: type.color }}
                  />
                  {type.display_name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject Area Tags */}
      {subjectAreas.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Emneområder:</span>
          {subjectAreas.map((area) => (
            <Badge
              key={area.id}
              variant={selectedSubjectAreas.includes(area.id) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => onSubjectAreaToggle(area.id)}
            >
              <div 
                className="w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: area.color }}
              />
              {area.display_name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeFilterBar;
