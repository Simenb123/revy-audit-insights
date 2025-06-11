
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Play, Pause, Award } from 'lucide-react';

interface ActionStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig = {
  not_started: {
    label: 'Ikke startet',
    variant: 'secondary' as const,
    icon: Pause,
    color: 'text-gray-500'
  },
  in_progress: {
    label: 'Pågående',
    variant: 'default' as const,
    icon: Play,
    color: 'text-blue-500'
  },
  completed: {
    label: 'Fullført',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-500'
  },
  reviewed: {
    label: 'Under gjennomgang',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-orange-500'
  },
  approved: {
    label: 'Godkjent',
    variant: 'default' as const,
    icon: Award,
    color: 'text-green-600'
  }
};

const ActionStatusBadge = ({ status, size = 'sm' }: ActionStatusBadgeProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <Icon size={size === 'sm' ? 12 : 14} className={config.color} />
      {config.label}
    </Badge>
  );
};

export default ActionStatusBadge;
