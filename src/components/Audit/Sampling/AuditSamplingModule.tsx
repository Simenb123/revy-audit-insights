import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Archive, FileCheck, Settings } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

// Import sub-components (will create these next)
import PopulationSelector from './PopulationSelector';
import SamplingParametersForm from './SamplingParametersForm';
import RiskMatrixConfig from './RiskMatrixConfig';
import StratificationConfig from './StratificationConfig';
import HighValueThresholdConfig from './HighValueThresholdConfig';
import SampleResultsDisplay from './SampleResultsDisplay';
import ExportOptions from './ExportOptions';
import SavedSamplesManager from './SavedSamplesManager';

interface AuditSamplingModuleProps {
  clientId: string;
}

const AuditSamplingModule: React.FC<AuditSamplingModuleProps> = ({ clientId }) => {
  const { selectedFiscalYear } = useFiscalYear();
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revisjonsutvalg</h1>
          <p className="text-muted-foreground">
            Generer og administrer statistiske utvalg for revisjonstesting
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Settings className="h-4 w-4" />
          Regnskapsår {selectedFiscalYear}
        </div>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Generer utvalg
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Kontroller utvalg
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Lagrede utvalg
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <GenerateTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          <ReviewTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <SavedTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Generate Tab Component
const GenerateTab: React.FC<{ clientId: string }> = ({ clientId }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left column - Configuration */}
      <div className="xl:col-span-2 space-y-6">
        <PopulationSelector clientId={clientId} />
        <SamplingParametersForm clientId={clientId} />
        <RiskMatrixConfig />
        <HighValueThresholdConfig />
        <StratificationConfig />
      </div>

      {/* Right column - Results and Export */}
      <div className="space-y-6">
        <SampleResultsDisplay />
        <ExportOptions />
      </div>
    </div>
  );
};

// Review Tab Component  
const ReviewTab: React.FC<{ clientId: string }> = ({ clientId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontroller utvalg</CardTitle>
        <CardDescription>
          Utfør kontroller på genererte utvalg og registrer avvik
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* This will integrate with the existing sample review functionality */}
        <SavedSamplesManager clientId={clientId} showReviewMode={true} />
      </CardContent>
    </Card>
  );
};

// Saved Tab Component
const SavedTab: React.FC<{ clientId: string }> = ({ clientId }) => {
  return (
    <SavedSamplesManager clientId={clientId} showReviewMode={false} />
  );
};

export default AuditSamplingModule;