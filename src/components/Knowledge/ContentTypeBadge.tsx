
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ContentType } from '@/types/knowledge';

interface ContentTypeBadgeProps {
  contentType: ContentType;
  size?: 'sm' | 'default';
}

const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ contentType, size = 'default' }) => {
  const getVariantByType = (name: string) => {
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

  return (
    <Badge 
      variant={getVariantByType(contentType.name)} 
      className={size === 'sm' ? 'text-xs' : ''}
      style={{ backgroundColor: contentType.color + '20', color: contentType.color }}
    >
      {contentType.display_name}
    </Badge>
  );
};

export default ContentTypeBadge;
