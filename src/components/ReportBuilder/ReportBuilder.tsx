import React from 'react';
import { WidgetManagerProvider } from '@/contexts/WidgetManagerContext';
import { ReportBuilderContent } from './ReportBuilderContent';
import { Card, CardContent } from '@/components/ui/card';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { ClassificationProvider } from '@/contexts/ClassificationContext';

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
      <WidgetManagerProvider>
        <ReportBuilderContent 
          clientId={clientId}
          hasData={hasData}
          selectedFiscalYear={selectedFiscalYear}
        />
      </WidgetManagerProvider>
    </ClassificationProvider>
  );
}