import React from 'react';
import type { ClientAuditAction } from '@/types/audit-actions';

interface ActionDrawerHeaderProps {
  action: ClientAuditAction | null;
  title: string;
  subtitle: string;
}

const ActionDrawerHeader: React.FC<ActionDrawerHeaderProps> = ({ action, title, subtitle }) => {
  return (
    <div className="px-6 pt-6 pb-4 border-b">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action && (
          <div className="text-xs text-muted-foreground">
            Fase: {action.phase} · Status: {action.status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionDrawerHeader;
