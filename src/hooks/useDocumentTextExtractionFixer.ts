import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { devLog } from '@/utils/devLogger';

export interface DocumentExtractionFixerResult {
  fixed: number;
  failed: number;
  errors: string[];
}

export const useDocumentTextExtractionFixer = () => {
  const [isFixing, setIsFixing] = useState(false);

  // Reset stuck documents that have been processing for too long
  const resetStuckDocuments = async (): Promise<DocumentExtractionFixerResult> => {
    setIsFixing(true);
    const result: DocumentExtractionFixerResult = { fixed: 0, failed: 0, errors: [] };

    try {
      devLog('🔄 Starting reset of stuck documents...');

      // Find documents stuck in processing for more than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const { data: stuckDocs, error: queryError } = await supabase
        .from('client_documents_files')
        .select('id, file_name, updated_at')
        .eq('text_extraction_status', 'processing')
        .lt('updated_at', tenMinutesAgo);

      if (queryError) {
        throw new Error(`Query error: ${queryError.message}`);
      }

      if (!stuckDocs || stuckDocs.length === 0) {
        devLog('✅ No stuck documents found');
        toast({
          title: "Ingen stuck dokumenter",
          description: "Alle dokumenter ser ut til å være i normal tilstand",
        });
        return result;
      }

      devLog('📋 Found stuck documents:', stuckDocs.length);

      // Reset each stuck document
      for (const doc of stuckDocs) {
        try {
          const { error: resetError } = await supabase
            .from('client_documents_files')
            .update({
              text_extraction_status: 'pending',
              extracted_text: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id);

          if (resetError) {
            result.errors.push(`Failed to reset ${doc.file_name}: ${resetError.message}`);
            result.failed++;
          } else {
            devLog(`✅ Reset document: ${doc.file_name}`);
            result.fixed++;
          }
        } catch (error) {
          result.errors.push(`Error resetting ${doc.file_name}: ${error.message}`);
          result.failed++;
        }
      }

      toast({
        title: "Stuck dokumenter tilbakestilt",
        description: `${result.fixed} dokumenter tilbakestilt, ${result.failed} feilet`,
        variant: result.failed > 0 ? "destructive" : "default"
      });

    } catch (error) {
      devLog('❌ Error resetting stuck documents:', error);
      result.errors.push(`System error: ${error.message}`);
      toast({
        title: "Feil ved tilbakestilling",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }

    return result;
  };

  // Retry failed documents with improved error handling
  const retryFailedDocuments = async (documentIds?: string[]): Promise<DocumentExtractionFixerResult> => {
    setIsFixing(true);
    const result: DocumentExtractionFixerResult = { fixed: 0, failed: 0, errors: [] };

    try {
      devLog('🔄 Starting retry of failed documents...');

      let docsToRetry;

      if (documentIds && documentIds.length > 0) {
        // Retry specific documents
        const { data, error } = await supabase
          .from('client_documents_files')
          .select('id, file_name')
          .in('id', documentIds);

        if (error) throw error;
        docsToRetry = data;
      } else {
        // Find all failed documents
        const { data, error } = await supabase
          .from('client_documents_files')
          .select('id, file_name')
          .eq('text_extraction_status', 'failed');

        if (error) throw error;
        docsToRetry = data;
      }

      if (!docsToRetry || docsToRetry.length === 0) {
        devLog('✅ No failed documents to retry');
        toast({
          title: "Ingen dokumenter å prøve på nytt",
          description: "Alle dokumenter har allerede blitt prosessert",
        });
        return result;
      }

      devLog('📋 Found documents to retry:', docsToRetry.length);

      // Retry each failed document by calling the enhanced edge function
      for (const doc of docsToRetry) {
        try {
          // First, reset status to pending
          const { error: resetError } = await supabase
            .from('client_documents_files')
            .update({
              text_extraction_status: 'pending',
              extracted_text: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id);

          if (resetError) {
            throw new Error(`Reset failed: ${resetError.message}`);
          }

          // Then trigger the enhanced extraction
          const { error: invokeError } = await supabase.functions.invoke('enhanced-pdf-text-extractor', {
            body: { documentId: doc.id }
          });

          if (invokeError) {
            throw new Error(`Extraction failed: ${invokeError.message}`);
          }

          devLog(`✅ Retry initiated for: ${doc.file_name}`);
          result.fixed++;

          // Add small delay between retries to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          devLog(`❌ Failed to retry ${doc.file_name}:`, error);
          result.errors.push(`Failed to retry ${doc.file_name}: ${error.message}`);
          result.failed++;

          // Mark as failed again
          await supabase
            .from('client_documents_files')
            .update({
              text_extraction_status: 'failed',
              extracted_text: `[Retry feilet: ${error.message}]`,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id);
        }
      }

      toast({
        title: "Retry fullført",
        description: `${result.fixed} dokumenter sendt til prosessering, ${result.failed} feilet`,
        variant: result.failed > 0 ? "destructive" : "default"
      });

    } catch (error) {
      devLog('❌ Error retrying failed documents:', error);
      result.errors.push(`System error: ${error.message}`);
      toast({
        title: "Feil ved retry",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }

    return result;
  };

  // Get documents needing attention
  const getProblematicDocuments = async () => {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const { data: stuckDocs } = await supabase
        .from('client_documents_files')
        .select('id, file_name, updated_at, text_extraction_status')
        .eq('text_extraction_status', 'processing')
        .lt('updated_at', tenMinutesAgo);

      const { data: failedDocs } = await supabase
        .from('client_documents_files')
        .select('id, file_name, extracted_text, text_extraction_status')
        .eq('text_extraction_status', 'failed');

      return {
        stuck: stuckDocs || [],
        failed: failedDocs || []
      };
    } catch (error) {
      devLog('❌ Error getting problematic documents:', error);
      return { stuck: [], failed: [] };
    }
  };

  return {
    resetStuckDocuments,
    retryFailedDocuments,
    getProblematicDocuments,
    isFixing
  };
};