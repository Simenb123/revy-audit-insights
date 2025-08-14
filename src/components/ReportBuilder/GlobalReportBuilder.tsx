import React from 'react';
import { WidgetManagerProvider } from '@/contexts/WidgetManagerContext';
import { ReportBuilderContent } from './ReportBuilderContent';
import { ClassificationProvider } from '@/contexts/ClassificationContext';
import { HistoryProvider } from '@/contexts/HistoryContext';
import { ScopeProvider } from '@/contexts/ScopeContext';

interface GlobalReportBuilderProps {
  clientId: 'global';
}

export function GlobalReportBuilder({ clientId }: GlobalReportBuilderProps) {
  // Global reports don't need specific client data validation
  // and should always be considered as having "data" available
  const hasData = true;
  console.log('GlobalReportBuilder: Rendering with providers for clientId:', clientId);

  const selectedFiscalYear = new Date().getFullYear() - 1; // Default to previous year

  console.log('GlobalReportBuilder: About to render with ScopeProvider');

  return (
    <ClassificationProvider>
      <ScopeProvider clientId={clientId} fiscalYear={selectedFiscalYear}>
        <WidgetManagerProvider clientId={clientId} year={selectedFiscalYear}>
          <HistoryProvider>
            <ReportBuilderContent 
              clientId={clientId}
              hasData={hasData}
              selectedFiscalYear={selectedFiscalYear}
            />
          </HistoryProvider>
        </WidgetManagerProvider>
      </ScopeProvider>
    </ClassificationProvider>
  );
}