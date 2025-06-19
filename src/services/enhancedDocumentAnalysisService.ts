
import { supabase } from '@/integrations/supabase/client';
import { AIRevyVariant } from '@/hooks/useAIRevyVariants';

export interface DocumentAnalysisInput {
  documentId: string;
  extractedText: string;
  fileName: string;
  clientId: string;
  variant?: AIRevyVariant;
}

export interface DocumentAnalysisResult {
  documentId: string;
  aiSuggestedCategory: string;
  aiConfidenceScore: number;
  aiAnalysisSummary: string;
  aiSuggestedSubjectAreas: string[];
  aiIsaStandardReferences: string[];
  aiRevisionPhaseRelevance: Record<string, number>;
}

export const analyzeDocumentWithAI = async (input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> => {
  try {
    const response = await supabase.functions.invoke('enhanced-document-ai', {
      body: {
        document_text: input.extractedText,
        file_name: input.fileName,
        client_id: input.clientId,
        variant_config: input.variant ? {
          name: input.variant.name,
          system_prompt: input.variant.system_prompt_template,
          context_requirements: input.variant.context_requirements
        } : undefined
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const result = response.data;
    
    return {
      documentId: input.documentId,
      aiSuggestedCategory: result.suggested_category || 'Ukategorisert',
      aiConfidenceScore: result.confidence_score || 0.5,
      aiAnalysisSummary: result.analysis_summary || 'Automatisk analyse fullført',
      aiSuggestedSubjectAreas: result.suggested_subject_areas || [],
      aiIsaStandardReferences: result.isa_standard_references || [],
      aiRevisionPhaseRelevance: result.revision_phase_relevance || {}
    };
    
  } catch (error) {
    console.error('AI document analysis failed:', error);
    throw new Error('Kunne ikke analysere dokumentet med AI');
  }
};

export const updateDocumentWithAnalysis = async (result: DocumentAnalysisResult) => {
  try {
    const { error } = await supabase
      .from('client_documents_files')
      .update({
        ai_suggested_category: result.aiSuggestedCategory,
        ai_confidence_score: result.aiConfidenceScore,
        ai_analysis_summary: result.aiAnalysisSummary,
        ai_suggested_subject_areas: result.aiSuggestedSubjectAreas,
        ai_isa_standard_references: result.aiIsaStandardReferences,
        ai_revision_phase_relevance: result.aiRevisionPhaseRelevance,
        updated_at: new Date().toISOString()
      })
      .eq('id', result.documentId);

    if (error) {
      throw error;
    }
    
  } catch (error) {
    console.error('Failed to update document with analysis:', error);
    throw new Error('Kunne ikke oppdatere dokumentet med analyseresultater');
  }
};

export const analyzeBulkDocuments = async (
  documents: Array<{ id: string; extracted_text: string; file_name: string; client_id: string }>,
  variant?: AIRevyVariant
): Promise<DocumentAnalysisResult[]> => {
  const results = [];
  
  for (const doc of documents) {
    try {
      const result = await analyzeDocumentWithAI({
        documentId: doc.id,
        extractedText: doc.extracted_text || '',
        fileName: doc.file_name,
        clientId: doc.client_id,
        variant
      });
      
      await updateDocumentWithAnalysis(result);
      results.push(result);
      
    } catch (error) {
      console.error(`Failed to analyze document ${doc.id}:`, error);
    }
  }
  
  return results;
};
