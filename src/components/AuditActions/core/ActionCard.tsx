import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, FileText, Brain, MessageCircle } from 'lucide-react';
import { AuditActionTemplate, ClientAuditAction } from '@/types/audit-actions';
import { getRiskBadgeVariant, getRiskLabel } from './badgeUtils';
import ActionStatusBadge from '../ActionStatusBadge';
import ActionQuickActions from '../ActionQuickActions';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';
import { PHASE_CONFIG } from '@/constants/auditPhases';
import type { AuditPhase } from '@/types/revio';
import { useActionComments } from '@/hooks/audit-actions/useActionComments';

interface ActionCardProps {
  type: 'template' | 'client-action';
  data: AuditActionTemplate | ClientAuditAction;
  selected?: boolean;
  onToggle?: (id: string) => void;
  onEdit?: (data: AuditActionTemplate | ClientAuditAction) => void;
  onCopyToClient?: (id: string) => void;
  dragHandle?: React.ReactNode;
  showCheckbox?: boolean;
  showQuickActions?: boolean;
  enhancedMetadata?: {
    isaCount?: number;
    documentCount?: number;
    hasAI?: boolean;
  };
}

const ActionCard = ({
  type,
  data,
  selected = false,
  onToggle,
  onEdit,
  onCopyToClient,
  dragHandle,
  showCheckbox = true,
  showQuickActions = true,
  enhancedMetadata,
}: ActionCardProps) => {
  const { data: subjectAreas } = useSubjectAreas();
  
  const isClientAction = type === 'client-action';
  const clientAction = isClientAction ? (data as ClientAuditAction) : null;
  const template = !isClientAction ? (data as AuditActionTemplate) : null;

  const { data: comments = [] } = useActionComments(isClientAction ? data.id : undefined);
  
  const unresolvedCommentCount = React.useMemo(() => {
    if (!isClientAction) return 0;
    const countUnresolved = (comments: any[]): number => {
      return comments.reduce((count, comment) => {
        let total = comment.is_resolved ? 0 : 1;
        if (comment.replies) {
          total += countUnresolved(comment.replies);
        }
        return count + total;
      }, 0);
    };
    return countUnresolved(comments);
  }, [comments, isClientAction]);

  const getSubjectAreaName = (areaKey: string): string => {
    const area = subjectAreas?.find((a) => a.name === areaKey);
    return area?.display_name || areaKey;
  };

  const getPhaseLabel = (phase: string): string => {
    return PHASE_CONFIG[phase as AuditPhase]?.label || phase;
  };

  const handleClick = () => {
    if (onEdit) {
      onEdit(data);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {showCheckbox && onToggle && (
            <div onClick={handleCheckboxClick} className="pt-1">
              <Checkbox 
                checked={selected} 
                onCheckedChange={() => onToggle(data.id)} 
              />
            </div>
          )}

          {dragHandle && (
            <div onClick={(e) => e.stopPropagation()}>{dragHandle}</div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-medium text-sm">{data.name}</h3>
              
              {isClientAction && clientAction && (
                <ActionStatusBadge status={clientAction.status} />
              )}
              
              <Badge variant="outline" className="text-xs">
                {getSubjectAreaName(data.subject_area)}
              </Badge>
              
              <Badge variant={getRiskBadgeVariant(data.risk_level)} className="text-xs">
                {getRiskLabel(data.risk_level)}
              </Badge>
            </div>

            {/* Description */}
            {data.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {data.description}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {data.action_type}
              </Badge>
              
              {data.estimated_hours && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {data.estimated_hours}t
                </span>
              )}

              {isClientAction && clientAction?.actual_hours && (
                <span className="flex items-center gap-1">
                  Faktisk: {clientAction.actual_hours}t
                </span>
              )}

              {/* Enhanced metadata */}
              {enhancedMetadata?.isaCount && enhancedMetadata.isaCount > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen size={12} />
                  {enhancedMetadata.isaCount} ISA
                </span>
              )}

              {enhancedMetadata?.documentCount && enhancedMetadata.documentCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {enhancedMetadata.documentCount} dok
                </span>
              )}

              {enhancedMetadata?.hasAI && (
                <span className="flex items-center gap-1">
                  <Brain size={12} />
                  AI
                </span>
              )}

              {isClientAction && unresolvedCommentCount > 0 && (
                <span className="flex items-center gap-1 text-primary">
                  <MessageCircle size={12} />
                  {unresolvedCommentCount}
                </span>
              )}
            </div>

            {/* Phases */}
            <div className="flex flex-wrap gap-1">
              {isClientAction && clientAction ? (
                <Badge variant="secondary" className="text-xs">
                  {getPhaseLabel(clientAction.phase)}
                </Badge>
              ) : (
                template?.applicable_phases.map((phase) => (
                  <Badge key={phase} variant="secondary" className="text-xs">
                    {getPhaseLabel(phase)}
                  </Badge>
                ))
              )}

              {template?.is_system_template && (
                <Badge variant="outline" className="text-xs">System</Badge>
              )}
            </div>

            {/* Client action specific */}
            {isClientAction && clientAction && (
              <>
                {clientAction.due_date && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Forfaller: {new Date(clientAction.due_date).toLocaleDateString('no-NO')}
                  </div>
                )}
                {clientAction.completed_at && (
                  <div className="text-xs text-green-600 mt-1">
                    Fullført: {new Date(clientAction.completed_at).toLocaleDateString('no-NO')}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
            {showQuickActions && isClientAction && clientAction && (
              <ActionQuickActions action={clientAction} onEdit={handleClick} />
            )}
            {!isClientAction && onCopyToClient && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyToClient(data.id);
                }}
                className="text-xs text-primary hover:underline"
              >
                Bruk
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionCard;
