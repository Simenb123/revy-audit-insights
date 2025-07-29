import React, { useState, useCallback } from 'react';
import { Database, BookOpen, Calculator } from 'lucide-react';
import ProgressiveUploadLayout from '@/components/DataUpload/ProgressiveUploadLayout';
import ChartOfAccountsUploader from './ChartOfAccountsUploader';
import TrialBalanceUploader from './TrialBalanceUploader';
import GeneralLedgerUploader from './GeneralLedgerUploader';
import AccountMappingTable from './AccountMappingTable';

interface ImprovedAccountingDataUploaderProps {
  clientId: string;
  clientName: string;
}

const ImprovedAccountingDataUploader = ({ clientId, clientName }: ImprovedAccountingDataUploaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleStepComplete = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    // Auto-advance to next step if not already there
    if (stepIndex === currentStep && stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  }, [currentStep]);

  const handleChartOfAccountsComplete = useCallback(() => {
    handleStepComplete(0);
  }, [handleStepComplete]);

  const handleTrialBalanceComplete = useCallback(() => {
    handleStepComplete(1);
  }, [handleStepComplete]);

  const handleGeneralLedgerComplete = useCallback(() => {
    handleStepComplete(2);
  }, [handleStepComplete]);

  const steps = [
    {
      id: 'chart-of-accounts',
      title: 'Kontoplan',
      description: 'Last opp kontoplanen som grunnlag for all regnskapsdata',
      icon: Database,
      component: (
        <ChartOfAccountsUploader 
          clientId={clientId} 
          onUploadComplete={handleChartOfAccountsComplete}
        />
      ),
      isComplete: completedSteps.has(0),
      isActive: currentStep === 0,
    },
    {
      id: 'trial-balance',
      title: 'Saldobalanse',
      description: 'Last opp saldobalansen med åpnings- og sluttsaldo for hver konto',
      icon: Calculator,
      component: (
        <TrialBalanceUploader 
          clientId={clientId} 
          onUploadComplete={handleTrialBalanceComplete}
        />
      ),
      isComplete: completedSteps.has(1),
      isActive: currentStep === 1,
    },
    {
      id: 'general-ledger',
      title: 'Hovedbok',
      description: 'Last opp detaljerte transaksjoner fra hovedboken',
      icon: BookOpen,
      component: (
        <GeneralLedgerUploader 
          clientId={clientId} 
          onUploadComplete={handleGeneralLedgerComplete}
        />
      ),
      isComplete: completedSteps.has(2),
      isActive: currentStep === 2,
    },
    {
      id: 'mapping',
      title: 'Kontomapping',
      description: 'Se og justér automatisk mapping av kontoer',
      icon: Database,
      component: <AccountMappingTable clientId={clientId} />,
      isComplete: completedSteps.has(3),
      isActive: currentStep === 3,
    },
  ];

  return (
    <ProgressiveUploadLayout
      clientId={clientId}
      clientName={clientName}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    />
  );
};

export default ImprovedAccountingDataUploader;