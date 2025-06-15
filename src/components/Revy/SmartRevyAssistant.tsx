
import React from 'react';
import { useSmartRevyAssistant } from '@/hooks/revy/useSmartRevyAssistant';
import { EmbeddedRevyAssistant } from './Assistant/EmbeddedRevyAssistant';
import { FloatingRevyAssistant } from './Assistant/FloatingRevyAssistant';

interface SmartRevyAssistantProps {
  embedded?: boolean;
  clientData?: any;
  userRole?: string;
}

const SmartRevyAssistant = ({ embedded = false, clientData, userRole }: SmartRevyAssistantProps) => {
  const hookProps = useSmartRevyAssistant({ clientData, userRole });
  
  if (embedded) {
    return <EmbeddedRevyAssistant {...hookProps} />;
  }

  return <FloatingRevyAssistant {...hookProps} />;
};

export default SmartRevyAssistant;
