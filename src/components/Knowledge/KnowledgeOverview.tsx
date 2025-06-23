
import React from 'react';
import { useLocation } from 'react-router-dom';
import ImprovedKnowledgeOverview from './ImprovedKnowledgeOverview';
import EnhancedKnowledgeOverview from './EnhancedKnowledgeOverview';
import ExpandedKnowledgeOverview from './ExpandedKnowledgeOverview';

const KnowledgeOverview = () => {
  const location = useLocation();
  
  // Check URL params to determine which version to use
  const useEnhancedVersion = location.search.includes('enhanced=true');
  const useExpandedVersion = location.search.includes('expanded=true');
  
  console.log('📚 [KNOWLEDGE_OVERVIEW] Rendering overview:', {
    path: location.pathname,
    search: location.search,
    useEnhancedVersion,
    useExpandedVersion
  });

  // Use the improved version by default (most robust)
  if (useExpandedVersion) {
    return <ExpandedKnowledgeOverview />;
  }
  
  if (useEnhancedVersion) {
    return <EnhancedKnowledgeOverview />;
  }

  // Default to the improved version which has better error handling
  return <ImprovedKnowledgeOverview />;
};

export default KnowledgeOverview;
