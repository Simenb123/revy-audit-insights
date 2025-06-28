
import React from 'react';
import AiReviCard from './AiReviCard';

interface SimplifiedSidebarSectionProps {
  title: string;
  description: string;
  className?: string;
  clientData?: { id: string };
}

const SimplifiedSidebarSection: React.FC<SimplifiedSidebarSectionProps> = ({ 
  title, 
  description, 
  className = '',
  clientData 
}) => {
  return (
    <AiReviCard
      title={title}
      description={description}
      className={className}
    />
  );
};

export default SimplifiedSidebarSection;
