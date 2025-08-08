import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface LayoutContextValue {
  globalHeaderHeight: number;
  subHeaderHeight: number;
}

export const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [globalHeaderHeight, setGlobalHeaderHeight] = useState(0);
  const [subHeaderHeight, setSubHeaderHeight] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const updateHeights = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      const globalHeight = parseInt(rootStyle.getPropertyValue('--global-header-height'), 10);
      setGlobalHeaderHeight(isNaN(globalHeight) ? 0 : globalHeight);

      const subHeader = document.querySelector('[data-sub-header]');
      const height = subHeader instanceof HTMLElement ? subHeader.offsetHeight : 0;
      setSubHeaderHeight(height);
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);

    return () => {
      window.removeEventListener('resize', updateHeights);
    };
  }, [location.pathname]);

  return (
    <LayoutContext.Provider value={{ globalHeaderHeight, subHeaderHeight }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

