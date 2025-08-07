import "../xhr.ts";
import { log } from "../_shared/log.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabase(req);
    const { testDocumentId } = await req.json();
    
    log(`🧪 [TEST-AI-PIPELINE] Testing AI pipeline for document: ${testDocumentId}`);
    
    // Get document info
    const { data: document, error: docError } = await supabase
      .from('client_documents_files')
      .select('*')
      .eq('id', testDocumentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    log(`📄 [TEST-AI-PIPELINE] Document: ${document.file_name}`);
    log(`📊 [TEST-AI-PIPELINE] Text length: ${document.extracted_text?.length || 0}`);
    log(`📋 [TEST-AI-PIPELINE] Text sample: ${document.extracted_text?.substring(0, 100) || 'No text'}`);

    // Test AI analyzer
    let analysisResult = null;
    if (!document.ai_analysis_summary) {
      try {
        log('🧠 [TEST-AI-PIPELINE] Testing AI analyzer...');
        
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('document-ai-analyzer', {
          body: {
            documentId: testDocumentId,
            text: document.extracted_text,
            fileName: document.file_name
          }
        });

        if (analysisError) {
          throw new Error(`Analysis failed: ${analysisError.message}`);
        }

        analysisResult = analysisData;
        log('✅ [TEST-AI-PIPELINE] AI analysis completed');
        
      } catch (error) {
        log(`❌ [TEST-AI-PIPELINE] AI analysis failed: ${error.message}`);
        analysisResult = { error: error.message };
      }
    }

    // Test AI categorizer
    let categorizationResult = null;
    if (!document.ai_suggested_category) {
      try {
        log('🏷️ [TEST-AI-PIPELINE] Testing AI categorizer...');
        
        const { data: categorizationData, error: categorizationError } = await supabase.functions.invoke('document-ai-categorizer', {
          body: {
            documentId: testDocumentId,
            fileName: document.file_name,
            extractedText: document.extracted_text
          }
        });

        if (categorizationError) {
          throw new Error(`Categorization failed: ${categorizationError.message}`);
        }

        categorizationResult = categorizationData;
        log('✅ [TEST-AI-PIPELINE] AI categorization completed');
        
      } catch (error) {
        log(`❌ [TEST-AI-PIPELINE] AI categorization failed: ${error.message}`);
        categorizationResult = { error: error.message };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      document: {
        id: document.id,
        fileName: document.file_name,
        textLength: document.extracted_text?.length || 0,
        textSample: document.extracted_text?.substring(0, 200) || 'No text'
      },
      analysis: analysisResult,
      categorization: categorizationResult,
      message: 'AI pipeline test completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in test-ai-pipeline function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'AI pipeline test failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});