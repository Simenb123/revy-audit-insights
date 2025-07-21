import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedCategory {
  id: string;
  name: string;
  display_name: string;
  category_type: string;
  color: string;
  risk_level: string;
  audit_phases: string[];
  isa_standard_reference: string[];
}

interface SmartFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  search: string;
  category: string;
  contentType: string;
  categoryType: string;
  riskLevel: string;
  auditPhase: string;
  isaStandard: string;
}

const AUDIT_PHASES = [
  { value: 'planning', label: 'Planlegging' },
  { value: 'execution', label: 'Gjennomføring' },
  { value: 'completion', label: 'Avslutning' }
];

const RISK_LEVELS = [
  { value: 'low', label: 'Lav risiko', color: '#10B981' },
  { value: 'medium', label: 'Middels risiko', color: '#F59E0B' },
  { value: 'high', label: 'Høy risiko', color: '#EF4444' }
];

const CATEGORY_TYPES = [
  { value: 'subject_area', label: 'Fagområde' },
  { value: 'process', label: 'Prosess' },
  { value: 'compliance', label: 'Regelverk' }
];

const PRESET_FILTERS = [
  { 
    label: 'Alle ISA-standarder', 
    filters: { isaStandard: 'ISA', search: 'ISA' } 
  },
  { 
    label: 'Høyrisiko områder', 
    filters: { riskLevel: 'high' } 
  },
  { 
    label: 'Planleggingsfase', 
    filters: { auditPhase: 'planning' } 
  },
  { 
    label: 'Regnskapsregler', 
    filters: { category: 'regnskap', categoryType: 'subject_area' } 
  },
  { 
    label: 'Hvitvaskingskontroll', 
    filters: { category: 'hvitvasking' } 
  }
];

export function SmartFilterBar({ onFilterChange }: SmartFilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    contentType: '',
    categoryType: '',
    riskLevel: '',
    auditPhase: '',
    isaStandard: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch unified categories
  const { data: categories } = useQuery({
    queryKey: ['unifiedCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as UnifiedCategory[];
    }
  });

  // Fetch content types
  const { data: contentTypes } = useQuery({
    queryKey: ['contentTypes'],
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

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const applyPresetFilter = (preset: any) => {
    const newFilters = { ...filters, ...preset.filters };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      search: '',
      category: '',
      contentType: '',
      categoryType: '',
      riskLevel: '',
      auditPhase: '',
      isaStandard: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Get ISA standards from categories
  const isaStandards = categories?.flatMap(cat => cat.isa_standard_reference || [])
    .filter((standard, index, arr) => arr.indexOf(standard) === index)
    .sort() || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Smart filtrering
        </CardTitle>
        <CardDescription>
          Avansert filtrering tilpasset norsk revisjon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset filters */}
        <div>
          <h4 className="text-sm font-medium mb-2">Hurtigfiltre</h4>
          <div className="flex flex-wrap gap-2">
            {PRESET_FILTERS.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyPresetFilter(preset)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i artikler..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Basic filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Fagområde/Kategori</label>
            <Select value={filters.category} onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Alle kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.display_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Innholdstype</label>
            <Select value={filters.contentType} onValueChange={(value) => updateFilter('contentType', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Alle typer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                {contentTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      {type.display_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Revisjonsfase</label>
            <Select value={filters.auditPhase} onValueChange={(value) => updateFilter('auditPhase', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Alle faser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle faser</SelectItem>
                {AUDIT_PHASES.map((phase) => (
                  <SelectItem key={phase.value} value={phase.value}>
                    {phase.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced filters toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground"
          >
            <Filter className="h-4 w-4 mr-2" />
            Avanserte filtre {showAdvanced ? '▼' : '▶'}
          </Button>
          
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                {activeFilterCount} aktive filtre
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Tøm filtre
            </Button>
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium">Kategoritype</label>
              <Select value={filters.categoryType} onValueChange={(value) => updateFilter('categoryType', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle typer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle typer</SelectItem>
                  {CATEGORY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Risikonivå</label>
              <Select value={filters.riskLevel} onValueChange={(value) => updateFilter('riskLevel', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle nivåer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle nivåer</SelectItem>
                  {RISK_LEVELS.map((risk) => (
                    <SelectItem key={risk.value} value={risk.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: risk.color }}
                        />
                        {risk.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">ISA-standard</label>
              <Select value={filters.isaStandard} onValueChange={(value) => updateFilter('isaStandard', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle standarder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle standarder</SelectItem>
                  {isaStandards.map((standard) => (
                    <SelectItem key={standard} value={standard}>
                      {standard}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}