
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PDFUploadManager from './PDFUploadManager';
import ConversionProgress from './ConversionProgress';
import HelpText from '@/components/HelpText/HelpText';
import { useQueryClient } from '@tanstack/react-query';

const PDFConversionWorkflow = () => {
  const queryClient = useQueryClient();

  const handleUploadComplete = () => {
    // Refresh the conversion progress data when upload completes
    queryClient.invalidateQueries({ queryKey: ['pdf-conversions'] });
  };

  const handlePreview = (jobId: string) => {
    console.log('Preview job:', jobId);
    // TODO: Implement preview functionality
    // This would navigate to the created article or show a preview modal
  };

  const handleRetry = (jobId: string) => {
    console.log('Retry job:', jobId);
    // The retry logic is handled in the ConversionProgress component
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">PDF-konvertering</h2>
        <p className="text-muted-foreground">
          Last opp PDF-dokumenter og konverter dem til strukturerte, søkbare artikler
        </p>
      </div>

      <HelpText variant="info" title="PDF til Strukturerte Artikler">
        <div className="space-y-2">
          <p>Denne funksjonen lar deg konvertere PDF-dokumenter til strukturerte artikler som:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Full tekstsøk:</strong> Alt innhold blir søkbart på tvers av systemet</li>
            <li><strong>AI-integrasjon:</strong> Revy kan sitere spesifikke deler av dokumentene</li>
            <li><strong>Cross-referencing:</strong> Automatiske lenker mellom relaterte dokumenter</li>
            <li><strong>Mobile-optimalisert:</strong> Fungerer perfekt på alle enheter</li>
            <li><strong>Versjonshåndtering:</strong> Enkel oppdatering når dokumenter endres</li>
          </ul>
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm"><strong>Merk:</strong> Konverteringsprosessen kan ta 2-5 minutter avhengig av dokumentstørrelse og kompleksitet.</p>
          </div>
        </div>
      </HelpText>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Last opp PDF</TabsTrigger>
          <TabsTrigger value="progress">
            Konverteringsstatus
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <PDFUploadManager onUploadComplete={handleUploadComplete} />
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-4">
          <ConversionProgress 
            onPreview={handlePreview}
            onRetry={handleRetry}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFConversionWorkflow;
