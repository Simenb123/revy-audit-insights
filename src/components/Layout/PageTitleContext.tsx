import React, { createContext, useContext, useState } from 'react';

interface PageTitleContextValue {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | undefined>(undefined);

let externalSetPageTitle: (title: string) => void = () => {};

export const PageTitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageTitle, setPageTitleState] = useState('');

  externalSetPageTitle = setPageTitleState;

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle: setPageTitleState }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export const usePageTitle = () => {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error('usePageTitle must be used within PageTitleProvider');
  }
  return context;
};

export const setPageTitle = (title: string) => externalSetPageTitle(title);

export default PageTitleContext;
