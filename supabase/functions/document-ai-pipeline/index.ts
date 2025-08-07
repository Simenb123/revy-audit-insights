import { log } from "../_shared/log.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentProcessRequest {
  documentId: string;
  triggerSource?: string;
}

interface ProcessingResult {
  documentId: string;
  success: boolean;
  steps: {
    analysis: { success: boolean; error?: string };
    categorization: { success: boolean; error?: string };
  };
  totalProcessingTime: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let documentId: string | null = null;

  try {
    const supabase = getSupabase(req);
    const { documentId: reqDocumentId, triggerSource = 'manual' }: DocumentProcessRequest = await req.json();
    
    documentId = reqDocumentId;
    
    if (!documentId) {
      throw new Error('documentId is required');
    }

    log(`🚀 [DOCUMENT-AI-PIPELINE] Starting AI processing for document: ${documentId} (triggered by: ${triggerSource})`);

    // Step 1: Fetch document info
    const { data: document, error: docError } = await supabase
      .from('client_documents_files')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || 'Unknown error'}`);
    }

    // Validate document is ready for AI processing
    if (document.text_extraction_status !== 'completed') {
      throw new Error(`Document not ready for AI processing. Status: ${document.text_extraction_status}`);
    }

    if (!document.extracted_text || document.extracted_text.trim().length < 10) {
      throw new Error('Document has no extracted text content');
    }

    log(`📄 [DOCUMENT-AI-PIPELINE] Processing: ${document.file_name} (${document.extracted_text.length} chars)`);

    const result: ProcessingResult = {
      documentId,
      success: false,
      steps: {
        analysis: { success: false },
        categorization: { success: false }
      },
      totalProcessingTime: 0
    };

    // Step 2: AI Analysis (only if not already done)
    if (!document.ai_analysis_summary) {
      try {
        log('🧠 [DOCUMENT-AI-PIPELINE] Starting AI analysis...');
        
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('document-ai-analyzer', {
          body: {
            documentId,
            text: document.extracted_text,
            fileName: document.file_name
          }
        });

        if (analysisError) {
          throw new Error(`Analysis failed: ${analysisError.message}`);
        }

        result.steps.analysis.success = true;
        log('✅ [DOCUMENT-AI-PIPELINE] AI analysis completed');
        
      } catch (error) {
        log(`❌ [DOCUMENT-AI-PIPELINE] AI analysis failed: ${error.message}`);
        result.steps.analysis.error = error.message;
        
        // Continue with categorization even if analysis fails
      }
    } else {
      log('⏭️ [DOCUMENT-AI-PIPELINE] AI analysis already exists, skipping');
      result.steps.analysis.success = true;
    }

    // Step 3: AI Categorization (only if not already done)
    if (!document.ai_suggested_category) {
      try {
        log('🏷️ [DOCUMENT-AI-PIPELINE] Starting AI categorization...');
        
        const { data: categorizationData, error: categorizationError } = await supabase.functions.invoke('document-ai-categorizer', {
          body: {
            documentId,
            fileName: document.file_name,
            extractedText: document.extracted_text
          }
        });

        if (categorizationError) {
          throw new Error(`Categorization failed: ${categorizationError.message}`);
        }

        result.steps.categorization.success = true;
        log('✅ [DOCUMENT-AI-PIPELINE] AI categorization completed');
        
      } catch (error) {
        log(`❌ [DOCUMENT-AI-PIPELINE] AI categorization failed: ${error.message}`);
        result.steps.categorization.error = error.message;
      }
    } else {
      log('⏭️ [DOCUMENT-AI-PIPELINE] AI categorization already exists, skipping');
      result.steps.categorization.success = true;
    }

    // Step 4: Update processing status
    const overallSuccess = result.steps.analysis.success && result.steps.categorization.success;
    result.success = overallSuccess;
    result.totalProcessingTime = Date.now() - startTime;

    if (overallSuccess) {
      // Mark as fully processed
      await supabase
        .from('client_documents_files')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
      
      log(`🎉 [DOCUMENT-AI-PIPELINE] Document fully processed in ${result.totalProcessingTime}ms`);
    } else {
      log(`⚠️ [DOCUMENT-AI-PIPELINE] Document partially processed in ${result.totalProcessingTime}ms`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: overallSuccess ? 'Document fully processed' : 'Document partially processed',
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    log(`❌ [DOCUMENT-AI-PIPELINE] Error processing document ${documentId}: ${error.message}`);
    
    // Try to update document with error status if we have documentId
    if (documentId) {
      try {
        const supabase = getSupabase(req);
        await supabase
          .from('client_documents_files')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
      } catch (updateError) {
        log(`❌ [DOCUMENT-AI-PIPELINE] Failed to update document status: ${updateError.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      documentId,
      processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});