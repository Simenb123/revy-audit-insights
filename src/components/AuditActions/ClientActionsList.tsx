
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ClientAuditAction, 
  AuditSubjectArea, 
  ACTION_TYPE_LABELS,
  ACTION_STATUS_LABELS 
} from '@/types/audit-actions';
import { CheckCircle, Clock, AlertCircle, User } from 'lucide-react';

interface ClientActionsListProps {
  actions: ClientAuditAction[];
  selectedArea: AuditSubjectArea;
  onActionUpdate?: (action: ClientAuditAction) => void;
}

const ClientActionsList = ({ actions, selectedArea, onActionUpdate }: ClientActionsListProps) => {
  const filteredActions = actions.filter(a => a.subject_area === selectedArea);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'not_started': return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'reviewed': return <CheckCircle className="w-4 h-4 text-purple-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-700" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = () => {
    if (filteredActions.length === 0) return 0;
    const completedActions = filteredActions.filter(a => 
      ['completed', 'reviewed', 'approved'].includes(a.status)
    ).length;
    return (completedActions / filteredActions.length) * 100;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Revisjonshandlinger for {selectedArea}
        </h3>
        <div className="text-sm text-gray-600">
          {filteredActions.length} handlinger
        </div>
      </div>

      {filteredActions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fremgang</span>
              <span className="text-sm text-gray-600">
                {Math.round(calculateProgress())}%
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </CardContent>
        </Card>
      )}

      {filteredActions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Ingen handlinger lagt til for dette fagområdet ennå.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <Card key={action.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStatusIcon(action.status)}
                      {action.name}
                    </CardTitle>
                    {action.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {ACTION_TYPE_LABELS[action.action_type]}
                    </Badge>
                    <Badge className={getStatusColor(action.status)}>
                      {ACTION_STATUS_LABELS[action.status]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {action.objective && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Formål:</p>
                    <p className="text-sm text-gray-600">{action.objective}</p>
                  </div>
                )}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Prosedyrer:</p>
                  <p className="text-sm text-gray-600">{action.procedures}</p>
                </div>
                
                {action.findings && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Funn:</p>
                    <p className="text-sm text-gray-600">{action.findings}</p>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                  <span>
                    Estimert: {action.estimated_hours || 0}t
                    {action.actual_hours && ` | Faktisk: ${action.actual_hours}t`}
                  </span>
                  {action.due_date && (
                    <span>
                      Frist: {new Date(action.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {action.assigned_to && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <User className="w-3 h-3" />
                    Tildelt bruker
                  </div>
                )}

                {onActionUpdate && (
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onActionUpdate(action)}
                    >
                      Rediger handling
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientActionsList;
