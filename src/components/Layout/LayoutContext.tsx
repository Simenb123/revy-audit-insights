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
    const readAndSetGlobalHeaderHeight = () => {
      const globalHeader = document.querySelector('[data-global-header]');
      if (globalHeader instanceof HTMLElement) {
        const height = globalHeader.offsetHeight || 0;
        setGlobalHeaderHeight(height);
        document.documentElement.style.setProperty('--global-header-current-height', `${height}px`);
      } else {
        // Fallback to CSS var if element not found
        const rootStyle = getComputedStyle(document.documentElement);
        const globalHeight = parseInt(rootStyle.getPropertyValue('--global-header-height'), 10);
        const fallback = isNaN(globalHeight) ? 0 : globalHeight;
        setGlobalHeaderHeight(fallback);
        document.documentElement.style.setProperty('--global-header-current-height', `${fallback}px`);
      }
    };

    const readAndSetSubHeaderHeight = () => {
      const subHeader = document.querySelector('[data-sub-header]');
      const height = subHeader instanceof HTMLElement ? subHeader.offsetHeight : 0;
      setSubHeaderHeight(height);
      // Expose current subheader height as CSS var for any sticky elements
      document.documentElement.style.setProperty('--sub-header-current-height', `${height}px`);
    };

    // Initial read
    readAndSetGlobalHeaderHeight();
    readAndSetSubHeaderHeight();

    // Observe dynamic size changes
    const globalHeader = document.querySelector('[data-global-header]') as HTMLElement | null;
    const subHeader = document.querySelector('[data-sub-header]') as HTMLElement | null;

    const roGlobal = new ResizeObserver(() => {
      readAndSetGlobalHeaderHeight();
    });
    if (globalHeader) roGlobal.observe(globalHeader);

    const roSub = new ResizeObserver(() => {
      readAndSetSubHeaderHeight();
    });
    if (subHeader) roSub.observe(subHeader);

    const handleResize = () => {
      readAndSetGlobalHeaderHeight();
      readAndSetSubHeaderHeight();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      roGlobal.disconnect();
      roSub.disconnect();
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
    // Fallback: derive heights from CSS variables to avoid crashes when provider is missing
    const rootStyle = getComputedStyle(document.documentElement);
    const globalCurrent = parseInt(rootStyle.getPropertyValue('--global-header-current-height') || '0', 10);
    const globalFallback = parseInt(rootStyle.getPropertyValue('--global-header-height') || '0', 10);
    const subCurrent = parseInt(rootStyle.getPropertyValue('--sub-header-current-height') || '0', 10);
    return {
      globalHeaderHeight: isNaN(globalCurrent) ? (isNaN(globalFallback) ? 0 : globalFallback) : globalCurrent,
      subHeaderHeight: isNaN(subCurrent) ? 0 : subCurrent,
    };
  }
  return context;
};

