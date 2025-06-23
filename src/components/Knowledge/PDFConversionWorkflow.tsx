
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PDFUploadManager from './PDFUploadManager';
import ConversionProgress from './ConversionProgress';
import HelpText from '@/components/HelpText/HelpText';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PDFConversionWorkflow = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUploadComplete = () => {
    // Refresh the conversion progress data when upload completes
    queryClient.invalidateQueries({ queryKey: ['pdf-conversions'] });
  };

  const handlePreview = async (jobId: string) => {
    console.log('Preview job:', jobId);
    
    try {
      // Find the corresponding knowledge article created from this PDF conversion
      const { data: article, error } = await supabase
        .from('knowledge_articles')
        .select('id, slug, title, status')
        .eq('metadata->pdf_conversion_job_id', jobId)
        .single();
      
      if (error || !article) {
        console.error('Article not found for job:', jobId, error);
        toast({
          title: "Forhåndsvisning ikke tilgjengelig",
          description: "Kunne ikke finne den konverterte artikkelen. Den kan fortsatt være under prosessering.",
          variant: "destructive"
        });
        return;
      }
      
      if (article.status !== 'published') {
        toast({
          title: "Artikkel ikke klar",
          description: "Artikkelen er fortsatt under prosessering. Prøv igjen om litt.",
          variant: "default"
        });
        return;
      }
      
      // Navigate to the article view
      console.log('Navigating to article:', article.slug);
      navigate(`/kunnskapsbase/artikkel/${article.slug}`);
      
      toast({
        title: "Åpner artikkel",
        description: `Viser konvertert artikkel: ${article.title}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error previewing converted article:', error);
      toast({
        title: "Feil ved forhåndsvisning",
        description: "En feil oppstod ved åpning av artikkelen. Prøv igjen.",
        variant: "destructive"
      });
    }
  };

  const handleRetry = (jobId: string) => {
    console.log('Retry job:', jobId);
    // The retry logic is handled in the ConversionProgress component
    queryClient.invalidateQueries({ queryKey: ['pdf-conversions'] });
    
    toast({
      title: "Konvertering startet på nytt",
      description: "PDF-konverteringen har blitt startet på nytt.",
      variant: "default"
    });
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
            <li><strong>Forhåndsvisning:</strong> Se det konverterte resultatet umiddelbart</li>
          </ul>
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm"><strong>Merk:</strong> Konverteringsprosessen kan ta 2-5 minutter avhengig av dokumentstørrelse og kompleksitet. Når konverteringen er ferdig, kan du forhåndsvise den opprettede artikkelen.</p>
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
