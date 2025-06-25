import React, { createContext, useContext, useEffect, useState } from 'react';

interface RightSidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
}

const RightSidebarContext = createContext<RightSidebarContextType | undefined>(undefined);

export const useRightSidebar = () => {
  const context = useContext(RightSidebarContext);
  if (!context) {
    throw new Error('useRightSidebar must be used within a RightSidebarProvider');
  }
  return context;
};

export const RightSidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem('rightSidebarWidth');
    return stored ? parseInt(stored, 10) : 320;
  });

  useEffect(() => {
    localStorage.setItem('rightSidebarWidth', width.toString());
  }, [width]);

  return (
    <RightSidebarContext.Provider value={{ isCollapsed, setIsCollapsed, width, setWidth }}>
      {children}
    </RightSidebarContext.Provider>
  );
};

export default RightSidebarContext;
