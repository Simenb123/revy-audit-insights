
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Upload, FileSpreadsheet, Database, ArrowRight } from 'lucide-react';
import { useAccountingData } from '@/hooks/useAccountingData';
import TrialBalanceUploader from './TrialBalanceUploader';
import GeneralLedgerUploader from './GeneralLedgerUploader';
import { VersionManagerCard } from '@/components/VersionManagement/VersionManagerCard';

interface RegnskapsDataManagerProps {
  clientId: string;
  clientName: string;
}

type Step = 'saldobalanse' | 'hovedbok' | 'completed';

const RegnskapsDataManager = ({ clientId, clientName }: RegnskapsDataManagerProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('saldobalanse');
  const { data: accountingData, isLoading } = useAccountingData(clientId);

  const steps = [
    {
      id: 'saldobalanse',
      title: 'Saldobalanse',
      description: 'Last opp saldobalanse for å etablere kontostruktur',
      icon: FileSpreadsheet,
      completed: accountingData?.chartOfAccountsCount > 0,
      required: true
    },
    {
      id: 'hovedbok',
      title: 'Hovedbok',
      description: 'Last opp hovedbok for detaljerte transaksjoner',
      icon: Database,
      completed: accountingData?.hasGeneralLedger || false,
      required: true
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  const getStepStatus = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step?.completed) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  const canProceedToStep = (stepId: string) => {
    if (stepId === 'saldobalanse') return true;
    if (stepId === 'hovedbok') return accountingData?.chartOfAccountsCount > 0;
    return false;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Regnskapsdata for {clientName}
              </CardTitle>
              <CardDescription>
                Last opp de essensielle regnskapsdataene for å starte revisjonen
              </CardDescription>
            </div>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {completedSteps} av {steps.length} fullført
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            
            {/* Step Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const canProceed = canProceedToStep(step.id);
                
                return (
                  <Card 
                    key={step.id}
                    className={`cursor-pointer transition-all ${
                      status === 'active' ? 'ring-2 ring-primary border-primary' :
                      status === 'completed' ? 'border-green-500 bg-green-50' :
                      canProceed ? 'hover:border-muted-foreground' : 'opacity-50'
                    }`}
                    onClick={() => canProceed && setCurrentStep(step.id as Step)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          status === 'completed' ? 'bg-green-100 text-green-600' :
                          status === 'active' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {status === 'completed' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <step.icon className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                          
                          {status === 'completed' && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Fullført
                            </Badge>
                          )}
                          
                          {status === 'active' && (
                            <Badge className="text-xs">
                              Aktiv
                            </Badge>
                          )}
                          
                          {!canProceed && status === 'pending' && (
                            <Badge variant="secondary" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Venter
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="space-y-4">
        {currentStep === 'saldobalanse' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Steg 1: Last opp Saldobalanse
              </CardTitle>
              <CardDescription>
                Saldobalansen etablerer kontostrukturen og er grunnlaget for all videre analyse. 
                Denne filen inneholder alle kontoer med deres balanser på et gitt tidspunkt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrialBalanceUploader 
                clientId={clientId}
                onUploadComplete={() => {
                  // Automatically move to next step after successful upload
                  setTimeout(() => setCurrentStep('hovedbok'), 1000);
                }}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 'hovedbok' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Steg 2: Last opp Hovedbok
              </CardTitle>
              <CardDescription>
                Hovedboken inneholder alle transaksjoner og er nødvendig for detaljerte revisjonshandlinger.
                Denne filen gir grunnlaget for substansielle analyser og tester.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralLedgerUploader 
                clientId={clientId}
                onUploadComplete={() => {
                  setCurrentStep('completed');
                }}
              />
            </CardContent>
          </Card>
        )}

        {progress === 100 && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Regnskapsdata er komplett!
              </h3>
              <p className="text-green-700 mb-4">
                Du har nå lastet opp de essensielle regnskapsdataene. Du kan nå fortsette med revisjonshandlinger.
              </p>
              <Button className="gap-2">
                Fortsett til revisjonshandlinger
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Version Management */}
      {accountingData?.hasGeneralLedger && (
        <VersionManagerCard clientId={clientId} />
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Trenger du hjelp?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="space-y-2">
            <li>• <strong>Saldobalanse:</strong> Excel/CSV-fil med kontonummer, kontonavn og balanse</li>
            <li>• <strong>Hovedbok:</strong> Excel/CSV-fil med alle transaksjoner inkludert dato, konto, beløp og beskrivelse</li>
            <li>• <strong>Problemer?</strong> Sjekk at filene har riktig format og inneholder nødvendige kolonner</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegnskapsDataManager;
