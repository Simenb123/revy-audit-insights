import React from 'react';
import { WidgetManagerProvider } from '@/contexts/WidgetManagerContext';
import { ReportBuilderContent } from './ReportBuilderContent';
import { Card, CardContent } from '@/components/ui/card';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { ClassificationProvider } from '@/contexts/ClassificationContext';
import { HistoryProvider, useHistory } from '@/contexts/HistoryContext';
import { Button } from '@/components/ui/button';
import { ScopeProvider } from '@/contexts/ScopeContext';
import { ScopeSelector } from './ScopeSelector';

interface ReportBuilderProps {
  clientId: string;
}

export default function ReportBuilder({ clientId }: ReportBuilderProps) {
  const { selectedFiscalYear } = useFiscalYear();
  
  // Check if we have trial balance data for widgets
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear
  );

  const hasData = trialBalanceData && trialBalanceData.trialBalanceEntries.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Laster regnskapsdata...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ClassificationProvider>
      <ScopeProvider clientId={clientId} fiscalYear={selectedFiscalYear}>
        <WidgetManagerProvider clientId={clientId} year={selectedFiscalYear}>
          <HistoryProvider>
            <HistoryWrapper
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

interface HistoryWrapperProps {
  clientId: string;
  hasData: boolean;
  selectedFiscalYear: number;
}

function HistoryWrapper({ clientId, hasData, selectedFiscalYear }: HistoryWrapperProps) {
  const { undo, redo, canUndo, canRedo } = useHistory();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={undo} disabled={!canUndo}>
            Angre
          </Button>
          <Button variant="outline" onClick={redo} disabled={!canRedo}>
            Gjør om
          </Button>
        </div>
        <ScopeSelector />
      </div>
      <ReportBuilderContent
        clientId={clientId}
        hasData={hasData}
        selectedFiscalYear={selectedFiscalYear}
      />
    </div>
  );
}