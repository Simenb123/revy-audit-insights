
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Client, AuditPhase, RevyContext } from '@/types/revio';

interface RevyContextType {
  currentContext: RevyContext;
  currentClient: Client | null;
  currentPhase: AuditPhase | null;
  isClientContext: boolean;
  contextualData: any;
  updateContext: (context: RevyContext, data?: any) => void;
  setContext: (context: RevyContext) => void;
}

const RevyContextContext = createContext<RevyContextType | undefined>(undefined);

export const useRevyContext = () => {
  const context = useContext(RevyContextContext);
  if (!context) {
    throw new Error('useRevyContext must be used within a RevyContextProvider');
  }
  return context;
};

export const RevyContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const [currentContext, setCurrentContext] = useState<RevyContext>('general');
  const [contextualData, setContextualData] = useState<any>({});

  // Get client data if we're in a client context
  const { data: client } = useClientDetails(orgNumber || '');

  // Determine context based on current route
  useEffect(() => {
    const path = location.pathname;
    let newContext: RevyContext = 'general';

    if (path.includes('/klienter/') && orgNumber) {
      if (path.includes('/regnskap')) {
        newContext = 'accounting-data';
      } else if (path.includes('/analyser')) {
        newContext = 'analysis';
      } else if (path.includes('/regnskapsdata')) {
        newContext = 'data-upload';
      } else if (path.includes('/revisjonshandlinger') || path.includes('/actions')) {
        newContext = 'audit-actions';
      } else if (path.includes('/risikovurdering') || path.includes('/risk')) {
        newContext = 'risk-assessment';
      } else if (path.includes('/dokumentasjon') || path.includes('/documents')) {
        newContext = 'documentation';
      } else if (path.includes('/team') || path.includes('/samarbeid')) {
        newContext = 'collaboration';
      } else {
        newContext = 'client-detail';
      }
    } else if (path.includes('/klienter')) {
      newContext = 'client-overview';
    } else if (path.includes('/dashboard')) {
      newContext = 'dashboard';
    } else if (path.includes('/fag') || path.includes('/knowledge')) {
      newContext = 'knowledge-base';
    } else if (path.includes('/teams')) {
      newContext = 'team-management';
    } else if (path.includes('/communication')) {
      newContext = 'communication';
    }
    
    setCurrentContext(newContext);

    // Update contextual data based on client
    if (client) {
      setContextualData({
        client,
        industry: client.industry,
        phase: client.phase,
        progress: client.progress,
        orgNumber: client.org_number,
        companyName: client.company_name
      });
    } else {
      setContextualData({});
    }
  }, [location.pathname, orgNumber, client]);

  const updateContext = (context: RevyContext, data?: any) => {
    setCurrentContext(context);
    if (data) {
      setContextualData(prev => ({ ...prev, ...data }));
    }
  };

  const setContext = (context: RevyContext) => {
    setCurrentContext(context);
  };

  const value: RevyContextType = {
    currentContext,
    currentClient: client || null,
    currentPhase: client?.phase || null,
    isClientContext: !!orgNumber && !!client,
    contextualData,
    updateContext,
    setContext
  };

  return (
    <RevyContextContext.Provider value={value}>
      {children}
    </RevyContextContext.Provider>
  );
};
