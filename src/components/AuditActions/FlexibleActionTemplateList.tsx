import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditActionTemplate, AuditPhase } from '@/types/audit-actions';
import { Copy, Edit, Search, Filter, Sparkles } from 'lucide-react';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';
import { useTags } from '@/hooks/knowledge/useTags';
import CreateActionTemplateDialog from './CreateActionTemplateDialog';
import EnhancedActionTemplateList from './EnhancedActionTemplateList';

interface FlexibleActionTemplateListProps {
  templates: AuditActionTemplate[];
  selectedArea?: string;
  onCopyToClient?: (templateIds: string[]) => void;
  onEditTemplate?: (template: AuditActionTemplate) => void;
}

const FlexibleActionTemplateList = ({ 
  templates, 
  selectedArea, 
  onCopyToClient, 
  onEditTemplate
}: FlexibleActionTemplateListProps) => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'basic' | 'enhanced'>('enhanced');

  const { data: subjectAreas } = useSubjectAreas();
  const { data: tags } = useTags();

  // Filter templates based on all criteria
  const filteredTemplates = templates.filter(template => {
    const matchesArea = !selectedArea || template.subject_area === selectedArea;
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.procedures.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || template.risk_level === riskFilter;
    const matchesPhase = phaseFilter === 'all' || 
      template.applicable_phases.includes(phaseFilter as AuditPhase);
    
    return matchesArea && matchesSearch && matchesRisk && matchesPhase;
  });

  const handleTemplateSelect = (templateId: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, templateId]);
    } else {
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    }
  };

  const handleCopySelected = () => {
    if (selectedTemplates.length > 0 && onCopyToClient) {
      onCopyToClient(selectedTemplates);
      setSelectedTemplates([]);
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSubjectAreaName = (areaKey: string) => {
    const area = subjectAreas?.find(a => a.name === areaKey);
    return area?.display_name || areaKey;
  };

  return (
    <div className="space-y-4">
      {/* Header with view mode toggle */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Handlingsmaler</CardTitle>
            <div className="flex gap-2">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'basic' | 'enhanced')}>
                <TabsList>
                  <TabsTrigger value="basic">Grunnleggende</TabsTrigger>
                  <TabsTrigger value="enhanced" className="gap-2">
                    <Sparkles size={14} />
                    Utvidet
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {selectedTemplates.length > 0 && onCopyToClient && viewMode === 'basic' && (
                <Button onClick={handleCopySelected} size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Kopier valgte ({selectedTemplates.length})
                </Button>
              )}
              <CreateActionTemplateDialog 
                selectedArea={selectedArea}
                trigger={
                  <Button size="sm">
                    Ny handlingsmal
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        
        {viewMode === 'basic' && (
          <CardContent className="space-y-4">
            {/* Search and filters for basic view */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i handlingsmaler..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div>
                <Label htmlFor="risk-filter" className="sr-only">Risikonivå</Label>
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
              </div>

              <div>
                <Label htmlFor="phase-filter" className="sr-only">Fase</Label>
                <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle faser</SelectItem>
                    <SelectItem value="engagement">Engasjement</SelectItem>
                    <SelectItem value="planning">Planlegging</SelectItem>
                    <SelectItem value="execution">Utførelse</SelectItem>
                    <SelectItem value="conclusion">Avslutning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground flex items-center">
                {filteredTemplates.length} av {templates.length} maler
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {viewMode === 'enhanced' ? (
        <EnhancedActionTemplateList
          selectedArea={selectedArea}
          onCopyToClient={onCopyToClient}
          onEditTemplate={onEditTemplate}
        />
      ) : (
        // Basic template list (existing implementation)
        <>
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <p className="mb-4">Ingen handlingsmaler funnet med de valgte filtrene.</p>
                <CreateActionTemplateDialog 
                  selectedArea={selectedArea}
                  trigger={
                    <Button>
                      Opprett første handlingsmal
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {onCopyToClient && (
                          <Checkbox
                            checked={selectedTemplates.includes(template.id)}
                            onCheckedChange={(checked) => 
                              handleTemplateSelect(template.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-base">{template.name}</h3>
                            <Badge variant="outline">
                              {getSubjectAreaName(template.subject_area)}
                            </Badge>
                          </div>
                          
                          {template.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {template.description}
                            </p>
                          )}

                          {template.objective && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-gray-700">Formål:</p>
                              <p className="text-sm text-gray-600">{template.objective}</p>
                            </div>
                          )}

                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">Prosedyrer:</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{template.procedures}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant={getRiskBadgeColor(template.risk_level)}>
                              {template.risk_level === 'high' ? 'Høy risiko' : 
                               template.risk_level === 'medium' ? 'Medium risiko' : 'Lav risiko'}
                            </Badge>
                            {template.estimated_hours && (
                              <Badge variant="outline">
                                {template.estimated_hours}t estimert
                              </Badge>
                            )}
                            {template.applicable_phases.map(phase => (
                              <Badge key={phase} variant="secondary" className="text-xs">
                                {phase === 'engagement' ? 'Engasjement' :
                                 phase === 'planning' ? 'Planlegging' : 
                                 phase === 'execution' ? 'Utførelse' : 
                                 phase === 'conclusion' ? 'Avslutning' : phase}
                              </Badge>
                            ))}
                            {template.is_system_template && (
                              <Badge variant="outline">System</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {onEditTemplate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditTemplate(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FlexibleActionTemplateList;
