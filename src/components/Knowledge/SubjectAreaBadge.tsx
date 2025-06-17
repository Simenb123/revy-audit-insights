
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Calculator, Coins, Folder } from 'lucide-react';

interface SubjectAreaBadgeProps {
  subjectArea: {
    display_name: string;
    color: string;
    icon?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const iconMap = {
  'shield-check': ShieldCheck,
  'calculator': Calculator,
  'coins': Coins,
  'folder': Folder,
  'file-text': Folder, // fallback
  'scale': Folder, // fallback
  'file-code': Folder, // fallback
  'book': Folder, // fallback
  'gavel': Folder, // fallback
};

const SubjectAreaBadge = ({ 
  subjectArea, 
  size = 'sm', 
  showIcon = true 
}: SubjectAreaBadgeProps) => {
  const IconComponent = iconMap[subjectArea.icon as keyof typeof iconMap] || Folder;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${sizeClasses[size]} inline-flex items-center gap-1.5 font-medium`}
      style={{ 
        backgroundColor: `${subjectArea.color}15`,
        color: subjectArea.color
      }}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {subjectArea.display_name}
    </Badge>
  );
};

export default SubjectAreaBadge;
