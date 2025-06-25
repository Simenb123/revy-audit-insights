
import React from 'react';
import AiReviCard from './AiReviCard';

const GeneralSidebarSection: React.FC = () => {
  return (
    <div className="flex flex-col h-full pb-4">
      <AiReviCard
        context="general"
        title="AI-Revi Assistent"
        description="Din smarte revisjonsassistent"
        className="mt-auto"
      />
    </div>
  );
};

export default GeneralSidebarSection;
