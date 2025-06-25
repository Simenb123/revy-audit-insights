import { supabase } from '@/integrations/supabase/client';

export interface DocumentAnalysisInput {
  documentId: string;
  fileName: string;
  extractedText: string;
  clientId?: string;
  variant?: any;
  auditActionContext?: {
    actionTemplateId?: string;
    subjectArea?: string;
    actionType?: string;
  };
}

export interface DocumentAnalysisResult {
  documentId: string;
  aiAnalysisSummary: string;
  aiSuggestedCategory?: string;
  aiConfidenceScore?: number;
  aiSuggestedSubjectAreas?: string[];
  aiIsaStandardReferences?: string[];
  relevantAuditActions?: Array<{
    actionTemplateId: string;
    actionName: string;
    relevanceScore: number;
    suggestedUse: string;
  }>;
  qualityIndicators?: {
    completeness: number;
    clarity: number;
    relevance: number;
    overall: number;
  };
  extractedKeyData?: Record<string, any>;
}

/**
 * Invoke either the basic or enhanced document analysis function depending on
 * the VITE_USE_ENHANCED_ANALYSIS environment variable.
 */
export const analyzeDocumentWithAI = async (
  input: DocumentAnalysisInput
): Promise<DocumentAnalysisResult> => {
  const useEnhanced = import.meta.env.VITE_USE_ENHANCED_ANALYSIS === 'true';

  if (useEnhanced) {
    const { data, error } = await supabase.functions.invoke('enhanced-document-ai', {
      body: {
        document_text: input.extractedText,
        file_name: input.fileName,
        ...(input.clientId ? { client_id: input.clientId } : {}),
        variant_config: input.variant,
        audit_action_context: input.auditActionContext,
      }
    });

    if (error) throw error;

    return {
      documentId: input.documentId,
      aiAnalysisSummary: data.analysis_summary,
      aiSuggestedCategory: data.suggested_category,
      aiConfidenceScore: data.confidence_score,
      aiSuggestedSubjectAreas: data.suggested_subject_areas,
      aiIsaStandardReferences: data.isa_standard_references,
      relevantAuditActions: data.relevant_audit_actions,
      qualityIndicators: data.quality_indicators,
      extractedKeyData: data.key_information
    } as DocumentAnalysisResult;
  }

  const { data, error } = await supabase.functions.invoke('document-ai-analyzer', {
    body: {
      documentId: input.documentId,
      text: input.extractedText,
      fileName: input.fileName
    }
  });

  if (error) throw error;

  return {
    documentId: input.documentId,
    aiAnalysisSummary: data.analysis || ''
  } as DocumentAnalysisResult;
};

export const updateDocumentWithAnalysis = async (
  result: DocumentAnalysisResult
): Promise<void> => {
  const updateData: Record<string, any> = {
    ai_analysis_summary: result.aiAnalysisSummary,
    updated_at: new Date().toISOString()
  };

  if (result.aiSuggestedCategory !== undefined) {
    updateData.category = result.aiSuggestedCategory;
  }
  if (result.aiConfidenceScore !== undefined) {
    updateData.ai_confidence_score = result.aiConfidenceScore;
  }
  if (result.aiSuggestedSubjectAreas !== undefined) {
    updateData.ai_suggested_subject_areas = result.aiSuggestedSubjectAreas;
  }
  if (result.aiIsaStandardReferences !== undefined) {
    updateData.ai_isa_standard_references = result.aiIsaStandardReferences;
  }

  await supabase
    .from('client_documents_files')
    .update(updateData)
    .eq('id', result.documentId);
};

