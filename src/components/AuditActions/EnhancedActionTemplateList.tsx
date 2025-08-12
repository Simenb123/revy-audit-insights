import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus } from 'lucide-react';
import { useEnhancedAuditActionTemplates } from '@/hooks/useEnhancedAuditActions';
import { useTemplateFilters } from '@/hooks/audit-actions/useTemplateFilters';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';
import EnhancedActionTemplateView from './EnhancedActionTemplateView';
import { EnhancedAuditActionTemplate } from '@/types/enhanced-audit-actions';
import { phaseLabels } from '@/constants/phaseLabels';

interface EnhancedActionTemplateListProps {
  selectedArea?: string;
  onCopyToClient?: (templateIds: string[]) => void;
  onEditTemplate?: (template: EnhancedAuditActionTemplate) => void;
  enableAI?: boolean;
  phase?: string;
}

const EnhancedActionTemplateList = ({
  selectedArea,
  onCopyToClient,
  onEditTemplate,
  enableAI = true,
  phase
}: EnhancedActionTemplateListProps) => {
  const { data: templates = [], isLoading } = useEnhancedAuditActionTemplates();
  const {
    searchTerm,
    setSearchTerm,
    riskFilter,
    setRiskFilter,
    phaseFilter,
    setPhaseFilter,
    aiFilter,
    setAiFilter,
    filteredTemplates
  } = useTemplateFilters(templates, { selectedArea, includeAI: enableAI, initialPhase: phase });
  const { data: subjectAreas } = useSubjectAreas();

  const getSubjectAreaName = (areaKey: string) => {
    const area = subjectAreas?.find(a => a.name === areaKey);
    return area?.display_name || areaKey;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Laster utvidede handlingsmaler...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Utvidede handlingsmaler</CardTitle>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ny handlingsmal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i handlingsmaler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Risikonivå" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle risikonivå</SelectItem>
                <SelectItem value="high">Høy risiko</SelectItem>
                <SelectItem value="medium">Medium risiko</SelectItem>
                <SelectItem value="low">Lav risiko</SelectItem>
              </SelectContent>
            </Select>

            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle faser</SelectItem>
                {Object.entries(phaseLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {enableAI && (
              <Select value={aiFilter} onValueChange={setAiFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="AI-status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="with_ai">Med AI-assistent</SelectItem>
                  <SelectItem value="without_ai">Uten AI-assistent</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredTemplates.length} av {templates.length} maler
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template list */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p className="mb-4">Ingen handlingsmaler funnet med de valgte filtrene.</p>
            <Button>
              Opprett første handlingsmal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <EnhancedActionTemplateView
              key={template.id}
              template={template}
              onCopyToClient={onCopyToClient ? (templateId) => onCopyToClient([templateId]) : undefined}
              onEditTemplate={onEditTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedActionTemplateList;
