
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Client, AuditPhase } from '@/types/revio';

interface RevyContextType {
  currentContext: string;
  currentClient: Client | null;
  currentPhase: AuditPhase | null;
  isClientContext: boolean;
  contextualData: any;
  updateContext: (context: string, data?: any) => void;
}

const RevyContext = createContext<RevyContextType | undefined>(undefined);

export const useRevyContext = () => {
  const context = useContext(RevyContext);
  if (!context) {
    throw new Error('useRevyContext must be used within a RevyContextProvider');
  }
  return context;
};

export const RevyContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const [currentContext, setCurrentContext] = useState('general');
  const [contextualData, setContextualData] = useState<any>({});

  // Get client data if we're in a client context
  const { data: client } = useClientDetails(orgNumber || '');

  // Determine context based on current route
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes('/klienter/') && orgNumber) {
      if (path.includes('/regnskap')) {
        setCurrentContext('accounting-data');
      } else if (path.includes('/analyser')) {
        setCurrentContext('analysis');
      } else if (path.includes('/regnskapsdata')) {
        setCurrentContext('data-upload');
      } else {
        setCurrentContext('client-detail');
      }
    } else if (path.includes('/klienter')) {
      setCurrentContext('client-overview');
    } else if (path.includes('/dashboard')) {
      setCurrentContext('dashboard');
    } else if (path.includes('/knowledge')) {
      setCurrentContext('knowledge-base');
    } else if (path.includes('/teams')) {
      setCurrentContext('collaboration');
    } else if (path.includes('/communication')) {
      setCurrentContext('communication');
    } else {
      setCurrentContext('general');
    }

    // Update contextual data based on client
    if (client) {
      setContextualData({
        client,
        industry: client.industry,
        phase: client.phase,
        progress: client.progress,
        orgNumber: client.orgNumber,
        companyName: client.companyName
      });
    } else {
      setContextualData({});
    }
  }, [location.pathname, orgNumber, client]);

  const updateContext = (context: string, data?: any) => {
    setCurrentContext(context);
    if (data) {
      setContextualData(prev => ({ ...prev, ...data }));
    }
  };

  const value: RevyContextType = {
    currentContext,
    currentClient: client || null,
    currentPhase: client?.phase || null,
    isClientContext: !!orgNumber && !!client,
    contextualData,
    updateContext
  };

  return (
    <RevyContext.Provider value={value}>
      {children}
    </RevyContext.Provider>
  );
};
