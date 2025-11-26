import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useEnhancedAuditActionTemplates } from '@/hooks/useEnhancedAuditActions';
import { useAuditActionsContext } from '@/contexts/AuditActionsContext';
import ActionCard from './core/ActionCard';
import ActionList from './core/ActionList';
import ActionFilters, { FilterConfig } from './core/ActionFilters';
import CreateActionTemplateDialog from './CreateActionTemplateDialog';
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
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    phase: (phase as any) || 'all',
  });

  const { data: templates = [], isLoading } = useEnhancedAuditActionTemplates();
  const { selectedIds, toggleSelect, selectAll, clearSelection } = useAuditActionsContext();

  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !filters.search || 
        template.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        template.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        template.procedures.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesPhase = filters.phase === 'all' || template.applicable_phases.includes(filters.phase as any);

      return matchesSearch && matchesPhase;
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Handlingsmaler</CardTitle>
            <div className="flex gap-2">
              {selectedIds.length > 0 && onCopyToClient && (
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
              phase: true,
            }}
          />
        </CardContent>
      </Card>

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
          />
        )}
        emptyState={
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="mb-4">Ingen handlingsmaler funnet.</p>
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
    </div>
  );
};

export default TemplateLibrary;
