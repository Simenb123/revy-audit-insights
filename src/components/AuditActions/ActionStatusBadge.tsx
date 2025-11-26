import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ACTION_STATUS_CONFIG, ActionStatus } from '@/constants/actionConfig';

interface ActionStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const ActionStatusBadge = ({ status, size = 'sm' }: ActionStatusBadgeProps) => {
  const config = ACTION_STATUS_CONFIG[status as ActionStatus] || ACTION_STATUS_CONFIG.not_started;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <Icon size={size === 'sm' ? 12 : 14} className={config.color} />
      {config.label}
    </Badge>
  );
};

export default ActionStatusBadge;
