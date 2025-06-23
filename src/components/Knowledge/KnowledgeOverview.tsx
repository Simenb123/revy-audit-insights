
import React from 'react';
import { useLocation } from 'react-router-dom';
import EnhancedKnowledgeOverview from './EnhancedKnowledgeOverview';
import ExpandedKnowledgeOverview from './ExpandedKnowledgeOverview';

const KnowledgeOverview = () => {
  const location = useLocation();
  
  // Use Enhanced version by default, but allow switching if needed
  // You can add query parameters or other logic here to switch between versions
  const useExpandedVersion = location.search.includes('expanded=true');
  
  console.log('📚 [KNOWLEDGE_OVERVIEW] Rendering overview:', {
    path: location.pathname,
    useExpandedVersion
  });

  if (useExpandedVersion) {
    return <ExpandedKnowledgeOverview />;
  }

  return <EnhancedKnowledgeOverview />;
};

export default KnowledgeOverview;
