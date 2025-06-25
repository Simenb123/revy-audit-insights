
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ContentType } from '@/types/classification';

interface ContentTypeBadgeProps {
  contentType: ContentType;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ 
  contentType, 
  size = 'default',
  showIcon = false 
}) => {
  const getVariantByType = (name: string | undefined) => {
    if (!name) return 'secondary';
    
    switch (name.toLowerCase()) {
      case 'isa-standard':
      case 'nrs-standard':
        return 'default';
      case 'lov':
      case 'forskrift':
        return 'destructive';
      case 'fagartikkel':
        return 'secondary';
      case 'forarbeider':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Ensure we have required properties with fallbacks
  const displayName = contentType?.display_name || contentType?.name || 'Ukjent type';
  const color = contentType?.color || '#6B7280';

  return (
    <Badge 
      variant={getVariantByType(contentType?.name)} 
      className={size === 'sm' ? 'text-xs' : ''}
      style={{ backgroundColor: color + '20', color: color }}
    >
      {displayName}
    </Badge>
  );
};

export default ContentTypeBadge;
