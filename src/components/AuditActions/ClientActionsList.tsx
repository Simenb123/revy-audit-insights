import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';
import { ClientAuditAction } from '@/types/audit-actions';
import ActionStatusBadge from './ActionStatusBadge';
import ActionQuickActions from './ActionQuickActions';
import ActionProgressIndicator from './ActionProgressIndicator';
import ActionDetailDrawer from './ActionDetailDrawer';
import NewActionDialog from './NewActionDialog';

interface ClientActionsListProps {
  actions: ClientAuditAction[];
  selectedArea: string;
  clientId: string;
  phase: import('@/types/revio').AuditPhase;
}

const ClientActionsList = ({ actions, selectedArea, clientId, phase }: ClientActionsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<ClientAuditAction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const handleEdit = (action: ClientAuditAction) => {
    setSelectedAction(action);
    setDrawerOpen(true);
  };

  // Filter actions by selected area, search term, and status
  const filteredActions = actions.filter(action => {
    const matchesArea = action.subject_area === selectedArea;
    const matchesSearch = action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
    
    return matchesArea && matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'Alle statuser' },
    { value: 'not_started', label: 'Ikke startet' },
    { value: 'in_progress', label: 'Pågående' },
    { value: 'completed', label: 'Fullført' },
    { value: 'reviewed', label: 'Under gjennomgang' },
    { value: 'approved', label: 'Godkjent' }
  ];

  return (
    <div className="space-y-4">
      <ActionProgressIndicator actions={filteredActions} />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Klienthandlinger</CardTitle>
            <Button size="sm" className="gap-2" onClick={() => setNewOpen(true)}>
              <Plus size={16} />
              Ny handling
            </Button>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Søk i handlinger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {actions.filter(a => a.subject_area === selectedArea).length === 0 
                ? (
                  <div className="space-y-3">
                    <div>Ingen handlinger funnet for dette fagområdet</div>
                    <Button size="sm" className="gap-2" onClick={() => setNewOpen(true)}>
                      <Plus size={16} />
                      Ny handling
                    </Button>
                  </div>
                ) : (
                  <div>Ingen handlinger matcher søkekriteriene</div>
                )
              }
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleEdit(action)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm truncate">{action.name}</h3>
                        <ActionStatusBadge status={action.status} />
                      </div>
                      
                      {action.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {action.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {action.action_type}
                          </Badge>
                        </span>
                        
                        {action.estimated_hours && (
                          <span>Estimat: {action.estimated_hours}t</span>
                        )}
                        
                        {action.actual_hours && (
                          <span>Faktisk: {action.actual_hours}t</span>
                        )}
                        
                        {action.risk_level && (
                          <Badge 
                            variant={action.risk_level === 'high' ? 'destructive' : 
                                   action.risk_level === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {action.risk_level === 'high' ? 'Høy risiko' : 
                             action.risk_level === 'medium' ? 'Medium risiko' : 'Lav risiko'}
                          </Badge>
                        )}
                      </div>
                      
                      {action.due_date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Forfaller: {new Date(action.due_date).toLocaleDateString('no-NO')}
                        </div>
                      )}
                      
                      {action.completed_at && (
                        <div className="text-xs text-green-600 mt-1">
                          Fullført: {new Date(action.completed_at).toLocaleDateString('no-NO')}
                        </div>
                      )}
                    </div>
                    
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionQuickActions action={action} onEdit={() => handleEdit(action)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActionDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        action={selectedAction}
      />

      {(() => {
        const areaActions = actions.filter(a => a.subject_area === selectedArea);
        const maxSort = areaActions.length ? Math.max(...areaActions.map(a => a.sort_order || 0)) : 0;
        const nextSortOrder = maxSort + 1;
        return (
          <NewActionDialog
            open={newOpen}
            onOpenChange={setNewOpen}
            clientId={clientId}
            selectedArea={selectedArea}
            phase={phase}
            nextSortOrder={nextSortOrder}
          />
        );
      })()}
    </div>
  );
};

export default ClientActionsList;
