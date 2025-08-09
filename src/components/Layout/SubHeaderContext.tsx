import React, { createContext, useContext, useMemo, useState } from 'react';

interface SubHeaderContextValue {
  node: React.ReactNode | null;
  setSubHeader: (node: React.ReactNode | null) => void;
  clearSubHeader: () => void;
}

const SubHeaderContext = createContext<SubHeaderContextValue | undefined>(undefined);

export const SubHeaderProvider = ({ children }: { children: React.ReactNode }) => {
  const [node, setNode] = useState<React.ReactNode | null>(null);

  const setSubHeader = (n: React.ReactNode | null) => setNode(n);
  const clearSubHeader = () => setNode(null);

  const value = useMemo(() => ({ node, setSubHeader, clearSubHeader }), [node]);

  return (
    <SubHeaderContext.Provider value={value}>
      {children}
    </SubHeaderContext.Provider>
  );
};

export const useSubHeader = () => {
  const ctx = useContext(SubHeaderContext);
  if (!ctx) throw new Error('useSubHeader must be used within a SubHeaderProvider');
  return ctx;
};

export default SubHeaderContext;
