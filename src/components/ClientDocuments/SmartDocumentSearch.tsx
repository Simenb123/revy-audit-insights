
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  FileText, 
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useDocumentTypes, useDocumentTags } from '@/hooks/useDocumentTypes';

interface SmartDocumentSearchProps {
  clientId: string;
}

const SmartDocumentSearch: React.FC<SmartDocumentSearchProps> = ({ clientId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: documentTypes = [] } = useDocumentTypes();
  const { data: documentTags = [] } = useDocumentTags();

  const smartSearchSuggestions = [
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Sammenlign saldobalanser 2022-2024",
      filters: { type: 'saldobalanse', period: 'multi-year' }
    },
    {
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Dokumenter som trenger gjennomgang",
      filters: { status: 'pending', tags: ['manual_review'] }
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Årsoppgjørsdokumenter 2024",
      filters: { period: '2024', tags: ['year_end'] }
    },
    {
      icon: <CheckCircle className="h-4 w-4" />,
      label: "AI-validerte dokumenter",
      filters: { status: 'validated', tags: ['automated'] }
    }
  ];

  const handleSmartSearch = (suggestion: typeof smartSearchSuggestions[0]) => {
    // Apply smart search filters
    if (suggestion.filters.type) setSelectedType(suggestion.filters.type);
    if (suggestion.filters.period) setSelectedPeriod(suggestion.filters.period);
    if (suggestion.filters.status) setSelectedStatus(suggestion.filters.status);
    if (suggestion.filters.tags) setSelectedTags(suggestion.filters.tags);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Intelligent dokumentsøk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Søk i dokumenter, metadata, AI-analyser..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Dokumenttype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle typer</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle perioder</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="q4-2024">Q4 2024</SelectItem>
                <SelectItem value="q3-2024">Q3 2024</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle statuser</SelectItem>
                <SelectItem value="validated">Validert</SelectItem>
                <SelectItem value="pending">Venter</SelectItem>
                <SelectItem value="failed">Feilet</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {selectedTags.length > 0 ? (
                  selectedTags.map(tagId => {
                    const tag = documentTags.find(t => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} variant="secondary" className="text-xs">
                        {tag.display_name}
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <span className="text-sm text-gray-500">Ingen tags valgt</span>
                )}
              </div>
            </div>
          </div>

          {/* Smart Search Suggestions */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
              <Brain className="h-4 w-4" />
              Smart søk-forslag
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {smartSearchSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSmartSearch(suggestion)}
                  className="justify-start h-auto p-3"
                >
                  <div className="flex items-center gap-2">
                    {suggestion.icon}
                    <span className="text-sm">{suggestion.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Search Results Preview */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Søkeresultater</h4>
              <span className="text-xs text-gray-500">47 dokumenter funnet</span>
            </div>
            
            <div className="space-y-2">
              {/* Mock search results */}
              <div className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-sm">Hovedbok_2024_Q4.xlsx</h5>
                    <p className="text-xs text-gray-600">Visma Business • Q4 2024 • 98% AI-sikkerhet</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">Hovedbok</Badge>
                      <Badge variant="outline" className="text-xs">Validert</Badge>
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              
              <div className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-sm">Saldobalanse_des_2024.pdf</h5>
                    <p className="text-xs text-gray-600">PowerOffice • Desember 2024 • 92% AI-sikkerhet</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">Saldobalanse</Badge>
                      <Badge variant="outline" className="text-xs">Trenger gjennomgang</Badge>
                    </div>
                  </div>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartDocumentSearch;
