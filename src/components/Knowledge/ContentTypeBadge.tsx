
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Scale, FileCode, Book, Gavel } from 'lucide-react';
import { ContentType } from '@/types/knowledge';

interface ContentTypeBadgeProps {
  contentType: ContentType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const CONTENT_TYPE_CONFIG = {
  'fagartikkel': {
    label: 'Fagartikkel',
    icon: FileText,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  'lov': {
    label: 'Lov',
    icon: Scale,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  'isa-standard': {
    label: 'ISA-standard',
    icon: FileCode,
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  'nrs-standard': {
    label: 'NRS-standard',
    icon: Book,
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  'forskrift': {
    label: 'Forskrift',
    icon: Gavel,
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  'forarbeider': {
    label: 'Forarbeider',
    icon: FileText,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const ContentTypeBadge = ({ contentType, size = 'sm', showIcon = true }: ContentTypeBadgeProps) => {
  const config = CONTENT_TYPE_CONFIG[contentType] || CONTENT_TYPE_CONFIG.fagartikkel;
  const IconComponent = config.icon;
  
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
      variant="outline" 
      className={`${config.className} ${sizeClasses[size]} inline-flex items-center gap-1.5 font-medium`}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
};

export default ContentTypeBadge;
