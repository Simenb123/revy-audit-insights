import React, { createContext, useContext, useState, useEffect } from 'react';

interface FiscalYearContextType {
  selectedClientId: string | null;
  selectedFiscalYear: number;
  setSelectedClientId: (clientId: string | null) => void;
  setSelectedFiscalYear: (year: number) => void;
  fiscalYearOptions: number[];
}

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(undefined);

export const useFiscalYear = () => {
  const context = useContext(FiscalYearContext);
  if (!context) {
    throw new Error('useFiscalYear must be used within a FiscalYearProvider');
  }
  return context;
};

export const FiscalYearProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(() => {
    const stored = localStorage.getItem('selectedFiscalYear');
    return stored ? parseInt(stored, 10) : new Date().getFullYear();
  });

  // Generate fiscal year options (current year and 5 years back/forward)
  const currentYear = new Date().getFullYear();
  const fiscalYearOptions = Array.from(
    { length: 11 }, 
    (_, i) => currentYear - 5 + i
  );

  useEffect(() => {
    localStorage.setItem('selectedFiscalYear', selectedFiscalYear.toString());
  }, [selectedFiscalYear]);

  useEffect(() => {
    if (selectedClientId) {
      localStorage.setItem('selectedClientId', selectedClientId);
    } else {
      localStorage.removeItem('selectedClientId');
    }
  }, [selectedClientId]);

  return (
    <FiscalYearContext.Provider 
      value={{ 
        selectedClientId, 
        selectedFiscalYear, 
        setSelectedClientId, 
        setSelectedFiscalYear,
        fiscalYearOptions
      }}
    >
      {children}
    </FiscalYearContext.Provider>
  );
};

export default FiscalYearContext;