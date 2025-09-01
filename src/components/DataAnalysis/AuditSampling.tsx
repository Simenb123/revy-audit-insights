import React from 'react';
import ConsolidatedAuditSampling from './ConsolidatedAuditSampling';
import AuditSampleManager from './AuditSampleManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileCheck } from 'lucide-react';

interface AuditSamplingProps {
  clientId: string;
}

const AuditSampling: React.FC<AuditSamplingProps> = ({ clientId }) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Generer utvalg
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Kontroller utvalg
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="mt-6" forceMount>
          <ConsolidatedAuditSampling clientId={clientId} />
        </TabsContent>
        
        <TabsContent value="review" className="mt-6" forceMount>
          <AuditSampleManager clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(AuditSampling);