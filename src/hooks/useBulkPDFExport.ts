import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { BilagPayload } from '@/types/bilag';
import { downloadPdf } from '@/services/pdf-storage';
import { useToast } from '@/hooks/use-toast';

export interface BulkExportProgress {
  total: number;
  completed: number;
  current: string;
  isRunning: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export const useBulkPDFExport = () => {
  const [progress, setProgress] = useState<BulkExportProgress>({
    total: 0,
    completed: 0,
    current: '',
    isRunning: false,
    hasError: false
  });
  
  const { toast } = useToast();

  const getFileName = (payload: BilagPayload): string => {
    const type = payload.type.replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a');
    const bilag = payload.bilag.toString().padStart(4, '0');
    const doknr = payload.doknr || 'ukjent';
    return `${type}-${bilag}-${doknr}.pdf`;
  };

  const getFolderName = (type: string): string => {
    const folderMap: Record<string, string> = {
      'salgsfaktura': '01_Salgsfakturaer',
      'leverandorfaktura': '02_Leverandorfakturaer', 
      'kundebetaling': '03_Kundebetalinger',
      'leverandorbetaling': '04_Leverandorbetalinger',
      'bankbilag': '05_Bankbilag',
      'diversebilag': '06_Diversebilag'
    };
    return folderMap[type] || '07_Andre';
  };

  const exportAllToPDF = useCallback(async (payloads: BilagPayload[]): Promise<void> => {
    if (payloads.length === 0) {
      toast({
        title: "Ingen bilag å eksportere",
        description: "Det er ingen bilag tilgjengelig for eksport.",
        variant: "destructive"
      });
      return;
    }

    setProgress({
      total: payloads.length,
      completed: 0,
      current: '',
      isRunning: true,
      hasError: false
    });

    const zip = new JSZip();
    let successful = 0;
    let failed = 0;

    try {
      for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i];
        const fileName = getFileName(payload);
        const folderName = getFolderName(payload.type);
        
        setProgress(prev => ({
          ...prev,
          completed: i,
          current: `Prosesserer ${fileName}...`
        }));

        try {
          const pdfBlob = await downloadPdf(payload);
          zip.folder(folderName)?.file(fileName, pdfBlob);
          successful++;
        } catch (error) {
          console.error(`Feil ved generering av PDF for ${fileName}:`, error);
          failed++;
        }
      }

      if (successful === 0) {
        throw new Error('Kunne ikke generere noen PDF-filer');
      }

      setProgress(prev => ({
        ...prev,
        current: 'Oppretter ZIP-fil...'
      }));

      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download ZIP file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bilag-export-${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "ZIP-eksport fullført!",
        description: `${successful} bilag eksportert. ${failed > 0 ? `${failed} bilag feilet.` : ''}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil oppstod';
      setProgress(prev => ({
        ...prev,
        hasError: true,
        errorMessage
      }));
      
      toast({
        title: "Eksport feilet",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setProgress(prev => ({
        ...prev,
        isRunning: false,
        current: prev.hasError ? prev.current : 'Fullført'
      }));
    }
  }, [toast]);

  const resetProgress = useCallback(() => {
    setProgress({
      total: 0,
      completed: 0,
      current: '',
      isRunning: false,
      hasError: false
    });
  }, []);

  return {
    progress,
    exportAllToPDF,
    resetProgress
  };
};