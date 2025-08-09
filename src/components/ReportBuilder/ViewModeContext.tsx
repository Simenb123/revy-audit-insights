import React, { createContext, useContext, useState } from 'react';

interface ViewModeContextType {
  isViewMode: boolean;
  setViewMode: (viewMode: boolean) => void;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children, initialIsViewMode = false }: { children: React.ReactNode; initialIsViewMode?: boolean }) {
  const [isViewMode, setIsViewMode] = useState(initialIsViewMode);

  const setViewMode = (viewMode: boolean) => {
    setIsViewMode(viewMode);
  };

  const toggleViewMode = () => {
    setIsViewMode(prev => !prev);
  };

  return (
    <ViewModeContext.Provider value={{
      isViewMode,
      setViewMode,
      toggleViewMode,
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}