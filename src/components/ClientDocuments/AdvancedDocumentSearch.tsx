import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, FileText, Calendar, Tag, Brain, X } from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocumentsList';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';

interface SearchFilters {
  query: string;
  category: string;
  dateRange: string;
  confidenceLevel: string;
  extractionStatus: string;
  hasAiAnalysis: boolean;
  subjectAreas: string[];
}

interface AdvancedDocumentSearchProps {
  documents: ClientDocument[];
  onSearchResults: (results: ClientDocument[]) => void;
  categories: string[];
}

const AdvancedDocumentSearch = ({ documents, onSearchResults, categories }: AdvancedDocumentSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    dateRange: '',
    confidenceLevel: '',
    extractionStatus: '',
    hasAiAnalysis: false,
    subjectAreas: []
  });
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Extract unique subject areas from documents
  const uniqueSubjectAreas = useMemo(() => {
    const areas = new Set<string>();
    documents.forEach(doc => {
      if (doc.ai_suggested_subject_areas) {
        doc.ai_suggested_subject_areas.forEach(area => areas.add(area));
      }
      if (doc.subject_area) {
        areas.add(doc.subject_area);
      }
    });
    return Array.from(areas).sort();
  }, [documents]);

  // Filter documents based on current filters
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Text search
      if (filters.query) {
        const searchText = filters.query.toLowerCase();
        const searchable = [
          doc.file_name,
          doc.ai_analysis_summary,
          doc.extracted_text,
          doc.category,
          doc.subject_area
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchable.includes(searchText)) {
          return false;
        }
      }

      // Category filter
      if (filters.category && doc.category !== filters.category) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const docDate = new Date(doc.created_at);
        const now = new Date();
        let cutoffDate: Date;
        
        switch (filters.dateRange) {
          case 'today':
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'quarter':
            cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            cutoffDate = new Date(0);
        }
        
        if (docDate < cutoffDate) {
          return false;
        }
      }

      // Confidence level filter
      if (filters.confidenceLevel) {
        const confidence = doc.ai_confidence_score || 0;
        switch (filters.confidenceLevel) {
          case 'high':
            if (confidence < 0.8) return false;
            break;
          case 'medium':
            if (confidence < 0.5 || confidence >= 0.8) return false;
            break;
          case 'low':
            if (confidence >= 0.5) return false;
            break;
          case 'none':
            if (confidence > 0) return false;
            break;
        }
      }

      // Extraction status filter
      if (filters.extractionStatus && doc.text_extraction_status !== filters.extractionStatus) {
        return false;
      }

      // AI analysis filter
      if (filters.hasAiAnalysis && !doc.ai_analysis_summary) {
        return false;
      }

      // Subject areas filter
      if (filters.subjectAreas.length > 0) {
        const docAreas = [
          ...(doc.ai_suggested_subject_areas || []),
          ...(doc.subject_area ? [doc.subject_area] : [])
        ];
        
        if (!filters.subjectAreas.some(area => docAreas.includes(area))) {
          return false;
        }
      }

      return true;
    });
  }, [documents, filters]);

  // Apply search results whenever filtered documents change
  React.useEffect(() => {
    onSearchResults(filteredDocuments);
  }, [filteredDocuments, onSearchResults]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubjectAreaToggle = useCallback((area: string) => {
    setFilters(prev => ({
      ...prev,
      subjectAreas: prev.subjectAreas.includes(area)
        ? prev.subjectAreas.filter(a => a !== area)
        : [...prev.subjectAreas, area]
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      category: '',
      dateRange: '',
      confidenceLevel: '',
      extractionStatus: '',
      hasAiAnalysis: false,
      subjectAreas: []
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.category) count++;
    if (filters.dateRange) count++;
    if (filters.confidenceLevel) count++;
    if (filters.extractionStatus) count++;
    if (filters.hasAiAnalysis) count++;
    if (filters.subjectAreas.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Avansert dokumentsøk
          <Badge variant="outline" className="ml-auto">
            {filteredDocuments.length} av {documents.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i dokumenter..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Advanced filters toggle */}
        <div className="flex items-center justify-between">
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Avanserte filtre
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                {/* Category filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategori</label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle kategorier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle kategorier</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date range filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tidsperiode</label>
                  <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle perioder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle perioder</SelectItem>
                      <SelectItem value="today">I dag</SelectItem>
                      <SelectItem value="week">Siste uke</SelectItem>
                      <SelectItem value="month">Siste måned</SelectItem>
                      <SelectItem value="quarter">Siste kvartal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* AI confidence filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI-sikkerhet</label>
                  <Select value={filters.confidenceLevel} onValueChange={(value) => handleFilterChange('confidenceLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle nivåer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle nivåer</SelectItem>
                      <SelectItem value="high">Høy (80%+)</SelectItem>
                      <SelectItem value="medium">Medium (50-80%)</SelectItem>
                      <SelectItem value="low">Lav (&lt;50%)</SelectItem>
                      <SelectItem value="none">Ikke analysert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Extraction status filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tekstutvinning</label>
                  <Select value={filters.extractionStatus} onValueChange={(value) => handleFilterChange('extractionStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle statuser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle statuser</SelectItem>
                      <SelectItem value="completed">Fullført</SelectItem>
                      <SelectItem value="processing">Prosesserer</SelectItem>
                      <SelectItem value="failed">Feilet</SelectItem>
                      <SelectItem value="pending">Venter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* AI analysis checkbox */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI-analyse</label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasAiAnalysis"
                      checked={filters.hasAiAnalysis}
                      onCheckedChange={(checked) => handleFilterChange('hasAiAnalysis', checked)}
                    />
                    <label htmlFor="hasAiAnalysis" className="text-sm">
                      Kun AI-analyserte
                    </label>
                  </div>
                </div>

                {/* Subject areas */}
                {uniqueSubjectAreas.length > 0 && (
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium">Fagområder</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSubjectAreas.map(area => (
                        <Badge
                          key={area}
                          variant={filters.subjectAreas.includes(area) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleSubjectAreaToggle(area)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Nullstill filtre
            </Button>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {filteredDocuments.filter(d => d.ai_analysis_summary).length}
            </div>
            <div className="text-sm text-muted-foreground">AI-analysert</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredDocuments.filter(d => d.text_extraction_status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Tekst uttrukket</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredDocuments.filter(d => d.category && d.category !== 'Ukategorisert').length}
            </div>
            <div className="text-sm text-muted-foreground">Kategorisert</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {filteredDocuments.filter(d => (d.ai_confidence_score || 0) >= 0.8).length}
            </div>
            <div className="text-sm text-muted-foreground">Høy sikkerhet</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedDocumentSearch;