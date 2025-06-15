
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
  const hookProps = useSmartRevyAssistant({ clientData, userRole, embedded });
  
  if (embedded) {
    // We don't pass session management props to the embedded view
    const { sessions, activeSessionId, setActiveSessionId, handleCreateSession, ...chatProps } = hookProps;
    return <EmbeddedRevyAssistant {...chatProps} />;
  }

  return <FloatingRevyAssistant {...hookProps} />;
};

export default SmartRevyAssistant;
