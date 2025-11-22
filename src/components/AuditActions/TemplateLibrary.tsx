import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Copy } from 'lucide-react';
import { useEnhancedAuditActionTemplates } from '@/hooks/useEnhancedAuditActions';
import { useAuditActionsContext } from '@/contexts/AuditActionsContext';
import ActionCard from './core/ActionCard';
import ActionList from './core/ActionList';
import ActionFilters, { FilterConfig } from './core/ActionFilters';
import CreateActionTemplateDialog from './CreateActionTemplateDialog';
import EnhancedTemplateView from './EnhancedTemplateView';
import { AuditActionTemplate } from '@/types/audit-actions';
import { EnhancedAuditActionTemplate } from '@/types/enhanced-audit-actions';

interface TemplateLibraryProps {
  phase?: string;
  onCopyToClient?: (templateIds: string[]) => void;
  onEditTemplate?: (template: AuditActionTemplate | EnhancedAuditActionTemplate) => void;
}

const TemplateLibrary = ({ 
  phase,
  onCopyToClient, 
  onEditTemplate
}: TemplateLibraryProps) => {
  const [viewMode, setViewMode] = useState<'basic' | 'enhanced'>('enhanced');
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    risk: 'all',
    phase: (phase as any) || 'all',
    aiEnabled: 'all',
  });

  const { data: templates = [], isLoading } = useEnhancedAuditActionTemplates();
  const { selectedIds, toggleSelect, selectAll, clearSelection, isSelected } = useAuditActionsContext();

  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !filters.search || 
        template.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        template.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        template.procedures.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesRisk = filters.risk === 'all' || template.risk_level === filters.risk;
      const matchesPhase = filters.phase === 'all' || template.applicable_phases.includes(filters.phase as any);
      const matchesAI = filters.aiEnabled === 'all' ||
        (filters.aiEnabled === 'with_ai' && template.ai_metadata) ||
        (filters.aiEnabled === 'without_ai' && !template.ai_metadata);

      return matchesSearch && matchesRisk && matchesPhase && matchesAI;
    });
  }, [templates, filters]);

  const handleCopySelected = () => {
    if (selectedIds.length > 0 && onCopyToClient) {
      onCopyToClient(selectedIds);
      clearSelection();
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTemplates.length) {
      clearSelection();
    } else {
      selectAll(filteredTemplates.map(t => t.id));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Laster handlingsmaler...
        </CardContent>
      </Card>
    );
  }

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
              
              {selectedIds.length > 0 && onCopyToClient && viewMode === 'basic' && (
                <Button onClick={handleCopySelected} size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Kopier valgte ({selectedIds.length})
                </Button>
              )}
              
              <CreateActionTemplateDialog 
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
          <CardContent>
            <ActionFilters
              filters={filters}
              onChange={setFilters}
              showSelectAll={onCopyToClient !== undefined}
              allSelected={selectedIds.length === filteredTemplates.length && filteredTemplates.length > 0}
              onToggleSelectAll={handleToggleSelectAll}
              resultCount={filteredTemplates.length}
              totalCount={templates.length}
              enabledFilters={{
                search: true,
                risk: true,
                phase: true,
                ai: true,
              }}
            />
          </CardContent>
        )}
      </Card>

      {/* Template list */}
      {viewMode === 'enhanced' ? (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <EnhancedTemplateView
              key={template.id}
              template={template}
              onCopyToClient={onCopyToClient ? (id) => onCopyToClient([id]) : undefined}
              onEditTemplate={onEditTemplate}
            />
          ))}
        </div>
      ) : (
        <ActionList
          items={filteredTemplates}
          renderItem={(template, { selected, onToggle }) => (
            <ActionCard
              type="template"
              data={template as any}
              selected={selected}
              onToggle={onToggle}
              onEdit={onEditTemplate as any}
              onCopyToClient={onCopyToClient ? (id) => onCopyToClient([id]) : undefined}
              showCheckbox={onCopyToClient !== undefined}
              showQuickActions={false}
              enhancedMetadata={{
                isaCount: template.isa_mappings?.length || 0,
                documentCount: template.document_mappings?.length || 0,
                hasAI: !!template.ai_metadata,
              }}
            />
          )}
          emptyState={
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p className="mb-4">Ingen handlingsmaler funnet med de valgte filtrene.</p>
                <CreateActionTemplateDialog 
                  trigger={
                    <Button>
                      Opprett første handlingsmal
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          }
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}
    </div>
  );
};

export default TemplateLibrary;
