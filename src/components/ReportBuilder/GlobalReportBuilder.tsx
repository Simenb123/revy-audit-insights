import React from 'react';
import { ReportBuilderContent } from './ReportBuilderContent';

interface GlobalReportBuilderProps {
  clientId: 'global';
}

export function GlobalReportBuilder({ clientId }: GlobalReportBuilderProps) {
  // Global reports don't need specific client data validation
  // and should always be considered as having "data" available
  const hasData = true;
  const selectedFiscalYear = new Date().getFullYear() - 1; // Default to previous year

  return (
    <ReportBuilderContent 
      clientId={clientId}
      hasData={hasData}
      selectedFiscalYear={selectedFiscalYear}
    />
  );
}