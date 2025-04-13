
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RevyContext } from '@/types/revio';

interface RevyContextProviderProps {
  children: ReactNode;
}

interface RevyContextState {
  currentContext: RevyContext;
  setContext: (context: RevyContext) => void;
}

const RevyContextStateContext = createContext<RevyContextState | undefined>(undefined);

export const RevyContextProvider = ({ children }: RevyContextProviderProps) => {
  const [currentContext, setCurrentContext] = useState<RevyContext>('general');

  const setContext = (context: RevyContext) => {
    setCurrentContext(context);
  };

  return (
    <RevyContextStateContext.Provider value={{ currentContext, setContext }}>
      {children}
    </RevyContextStateContext.Provider>
  );
};

export const useRevyContext = () => {
  const context = useContext(RevyContextStateContext);
  if (context === undefined) {
    throw new Error('useRevyContext must be used within a RevyContextProvider');
  }
  return context;
};
