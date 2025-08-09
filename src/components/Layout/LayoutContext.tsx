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
    const readGlobalHeaderHeight = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      const globalHeight = parseInt(rootStyle.getPropertyValue('--global-header-height'), 10);
      setGlobalHeaderHeight(isNaN(globalHeight) ? 0 : globalHeight);
    };

    const readAndSetSubHeaderHeight = () => {
      const subHeader = document.querySelector('[data-sub-header]');
      const height = subHeader instanceof HTMLElement ? subHeader.offsetHeight : 0;
      setSubHeaderHeight(height);
      // Expose current subheader height as CSS var for any sticky elements
      document.documentElement.style.setProperty('--sub-header-current-height', `${height}px`);
    };

    // Initial read
    readGlobalHeaderHeight();
    readAndSetSubHeaderHeight();

    // Observe dynamic size changes of subheader
    const subHeader = document.querySelector('[data-sub-header]') as HTMLElement | null;
    const ro = new ResizeObserver(() => {
      readAndSetSubHeaderHeight();
    });
    if (subHeader) ro.observe(subHeader);

    const handleResize = () => {
      readGlobalHeaderHeight();
      readAndSetSubHeaderHeight();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
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

