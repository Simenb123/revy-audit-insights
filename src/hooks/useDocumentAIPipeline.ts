import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { devLog } from '@/utils/devLogger';

export interface AutoPipelineResult {
  processed: number;
  failed: number;
  errors: string[];
}

export const useDocumentAIPipeline = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Process a single document through the AI pipeline
  const processDocument = async (documentId: string): Promise<boolean> => {
    try {
      devLog('🚀 Starting AI pipeline for document:', documentId);

      const { data, error } = await supabase.functions.invoke('document-ai-pipeline', {
        body: { 
          documentId,
          triggerSource: 'manual'
        }
      });

      if (error) {
        throw new Error(`Pipeline failed: ${error.message}`);
      }

      devLog('✅ AI pipeline completed:', data);
      return data.success;
      
    } catch (error) {
      devLog('❌ AI pipeline error:', error);
      throw error;
    }
  };

  // Process all completed documents that need AI processing
  const processAllPendingDocuments = async (): Promise<AutoPipelineResult> => {
    setIsProcessing(true);
    const result: AutoPipelineResult = { processed: 0, failed: 0, errors: [] };

    try {
      devLog('🔍 Finding documents needing AI processing...');

      // Find documents that are completed but missing AI analysis or categorization
      const { data: pendingDocs, error: queryError } = await supabase
        .from('client_documents_files')
        .select('id, file_name, ai_analysis_summary, ai_suggested_category')
        .eq('text_extraction_status', 'completed')
        .or('ai_analysis_summary.is.null,ai_suggested_category.is.null');

      if (queryError) {
        throw new Error(`Query error: ${queryError.message}`);
      }

      if (!pendingDocs || pendingDocs.length === 0) {
        devLog('✅ No documents need AI processing');
        toast({
          title: "Alle dokumenter er oppdaterte",
          description: "Ingen dokumenter trenger AI-prosessering akkurat nå",
        });
        return result;
      }

      devLog(`📋 Found ${pendingDocs.length} documents needing processing`);

      // Process each document
      for (const doc of pendingDocs) {
        try {
          const success = await processDocument(doc.id);
          if (success) {
            result.processed++;
            devLog(`✅ Processed: ${doc.file_name}`);
          } else {
            result.failed++;
            result.errors.push(`Failed to process ${doc.file_name}`);
          }

          // Small delay between documents to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          result.failed++;
          result.errors.push(`Error processing ${doc.file_name}: ${error.message}`);
          devLog(`❌ Failed to process ${doc.file_name}:`, error);
        }
      }

      toast({
        title: "AI-prosessering fullført",
        description: `${result.processed} dokumenter prosessert, ${result.failed} feilet`,
        variant: result.failed > 0 ? "destructive" : "default"
      });

    } catch (error) {
      devLog('❌ Error in auto pipeline:', error);
      result.errors.push(`System error: ${error.message}`);
      toast({
        title: "Feil ved automatisk prosessering",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }

    return result;
  };

  // Check how many documents need processing
  const getPendingCount = async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('client_documents_files')
        .select('*', { count: 'exact', head: true })
        .eq('text_extraction_status', 'completed')
        .or('ai_analysis_summary.is.null,ai_suggested_category.is.null');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      devLog('❌ Error getting pending count:', error);
      return 0;
    }
  };

  return {
    processDocument,
    processAllPendingDocuments,
    getPendingCount,
    isProcessing
  };
};