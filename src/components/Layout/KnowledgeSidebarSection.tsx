import React from 'react';
import { useLocation } from 'react-router-dom';
import SimplifiedSidebarSection from './SimplifiedSidebarSection';

const KnowledgeSidebarSection = () => {
  const location = useLocation();
  
  // Check if we're on a knowledge base page
  const isKnowledgePage = location.pathname.includes('knowledge');
  
  if (!isKnowledgePage) {
    return null;
  }

  return (
    <div className="space-y-4">
      
      <SimplifiedSidebarSection
        title="AI-Revi Kunnskapsbase"
        description="Spør om revisjonsstandarder og prosedyrer"
        className="border-l-4 border-l-purple-500"
      />
    </div>
  );
};

export default KnowledgeSidebarSection;
