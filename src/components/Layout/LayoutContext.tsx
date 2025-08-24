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
      // First set fallback from CSS before DOM query
      const rootStyle = getComputedStyle(document.documentElement);
      const cssHeight = parseInt(rootStyle.getPropertyValue('--global-header-height'), 10);
      const fallbackHeight = isNaN(cssHeight) ? 45 : cssHeight; // 45px as ultimate fallback
      
      const globalHeader = document.querySelector('[data-global-header]');
      if (globalHeader instanceof HTMLElement) {
        const height = globalHeader.offsetHeight || fallbackHeight;
        console.log('Global header height measured:', height);
        setGlobalHeaderHeight(height);
        document.documentElement.style.setProperty('--global-header-current-height', `${height}px`);
      } else {
        console.log('Global header element not found, using fallback:', fallbackHeight);
        setGlobalHeaderHeight(fallbackHeight);
        document.documentElement.style.setProperty('--global-header-current-height', `${fallbackHeight}px`);
      }
    };

    const readAndSetSubHeaderHeight = () => {
      const subHeader = document.querySelector('[data-sub-header]');
      if (subHeader instanceof HTMLElement) {
        const height = subHeader.offsetHeight || 0;
        console.log('Sub header height measured:', height);
        setSubHeaderHeight(height);
        document.documentElement.style.setProperty('--sub-header-current-height', `${height}px`);
      } else {
        console.log('Sub header element not found, setting height to 0');
        setSubHeaderHeight(0);
        document.documentElement.style.setProperty('--sub-header-current-height', '0px');
      }
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
    const globalCurrent = parseInt(rootStyle.getPropertyValue('--global-header-current-height') || '45', 10);
    const globalFallback = parseInt(rootStyle.getPropertyValue('--global-header-height') || '45', 10);
    const subCurrent = parseInt(rootStyle.getPropertyValue('--sub-header-current-height') || '0', 10);
    
    const finalGlobalHeight = isNaN(globalCurrent) ? (isNaN(globalFallback) ? 45 : globalFallback) : globalCurrent;
    const finalSubHeight = isNaN(subCurrent) ? 0 : subCurrent;
    
    console.log('Layout context fallback - Global:', finalGlobalHeight, 'Sub:', finalSubHeight);
    
    return {
      globalHeaderHeight: finalGlobalHeight,
      subHeaderHeight: finalSubHeight,
    };
  }
  return context;
};

