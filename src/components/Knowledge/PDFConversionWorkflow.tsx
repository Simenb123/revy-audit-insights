
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PDFUploadManager from './PDFUploadManager';
import ConversionProgress from './ConversionProgress';
import HelpText from '@/components/HelpText/HelpText';

interface ConversionJob {
  id: string;
  fileName: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  category: string;
  conversionType: 'full' | 'summary' | 'checklist';
  createdAt: string;
  estimatedTime?: number;
}

const PDFConversionWorkflow = () => {
  const [conversionJobs, setConversionJobs] = useState<ConversionJob[]>([]);

  const handleUploadComplete = (articleData: any) => {
    const newJob: ConversionJob = {
      id: Date.now().toString(),
      fileName: articleData.fileName,
      title: articleData.title,
      status: 'processing',
      progress: 0,
      category: articleData.category,
      conversionType: articleData.conversionType,
      createdAt: new Date().toISOString(),
      estimatedTime: 5
    };

    setConversionJobs(prev => [newJob, ...prev]);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setConversionJobs(prev => 
        prev.map(job => 
          job.id === newJob.id 
            ? { 
                ...job, 
                progress: Math.min(job.progress + 20, 100),
                estimatedTime: Math.max((job.estimatedTime || 5) - 1, 0)
              }
            : job
        )
      );
    }, 1000);

    // Complete after 5 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
      setConversionJobs(prev => 
        prev.map(job => 
          job.id === newJob.id 
            ? { ...job, status: 'completed', progress: 100, estimatedTime: 0 }
            : job
        )
      );
    }, 5000);
  };

  const handlePreview = (jobId: string) => {
    console.log('Preview job:', jobId);
    // In real implementation, this would open a preview of the converted article
  };

  const handleRetry = (jobId: string) => {
    setConversionJobs(prev => 
      prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'processing', progress: 0 }
          : job
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">PDF-konvertering</h2>
        <p className="text-muted-foreground">
          Last opp PDF-dokumenter og konverter dem til strukturerte, søkbare artikler
        </p>
      </div>

      <HelpText variant="info" title="Fase 2: PDF til Strukturerte Artikler">
        <div className="space-y-2">
          <p>Denne funksjonen lar deg konvertere PDF-dokumenter til strukturerte artikler som:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Full tekstsøk:</strong> Alt innhold blir søkbart på tvers av systemet</li>
            <li><strong>AI-integrasjon:</strong> Revy kan sitere spesifikke deler av dokumentene</li>
            <li><strong>Cross-referencing:</strong> Automatiske lenker mellom relaterte dokumenter</li>
            <li><strong>Mobile-optimalisert:</strong> Fungerer perfekt på alle enheter</li>
            <li><strong>Versjonshåndtering:</strong> Enkel oppdatering når dokumenter endres</li>
          </ul>
        </div>
      </HelpText>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Last opp PDF</TabsTrigger>
          <TabsTrigger value="progress">
            Konverteringsstatus
            {conversionJobs.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {conversionJobs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <PDFUploadManager onUploadComplete={handleUploadComplete} />
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-4">
          <ConversionProgress 
            jobs={conversionJobs}
            onPreview={handlePreview}
            onRetry={handleRetry}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFConversionWorkflow;
