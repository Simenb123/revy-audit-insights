import React, { createContext, useContext, useEffect, useState } from 'react';

interface RightSidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isHidden: boolean;
  setIsHidden: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [isHidden, setIsHidden] = useState(false);
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem('rightSidebarWidth');
    const parsed = stored ? parseInt(stored, 10) : NaN;
    const fallback = 360;
    const clamped = Math.min(600, Math.max(fallback, isNaN(parsed) ? fallback : parsed));
    return clamped;
  });

  useEffect(() => {
    localStorage.setItem('rightSidebarWidth', width.toString());
  }, [width]);

  return (
    <RightSidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isHidden, setIsHidden, width, setWidth }}>
      {children}
    </RightSidebarContext.Provider>
  );
};

export default RightSidebarContext;
