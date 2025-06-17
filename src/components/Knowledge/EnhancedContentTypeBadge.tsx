
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Scale, FileCode, Book, Gavel } from 'lucide-react';

interface EnhancedContentTypeBadgeProps {
  contentType: {
    display_name: string;
    color: string;
    icon?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const iconMap = {
  'file-text': FileText,
  'scale': Scale,
  'file-code': FileCode,
  'book': Book,
  'gavel': Gavel,
  'shield-check': FileText, // fallback
  'calculator': FileText, // fallback
  'coins': FileText, // fallback
  'folder': FileText, // fallback
};

const EnhancedContentTypeBadge = ({ 
  contentType, 
  size = 'sm', 
  showIcon = true 
}: EnhancedContentTypeBadgeProps) => {
  const IconComponent = iconMap[contentType.icon as keyof typeof iconMap] || FileText;
  
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
      className={`${sizeClasses[size]} inline-flex items-center gap-1.5 font-medium border-2`}
      style={{ 
        backgroundColor: `${contentType.color}20`,
        borderColor: contentType.color,
        color: contentType.color
      }}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {contentType.display_name}
    </Badge>
  );
};

export default EnhancedContentTypeBadge;
