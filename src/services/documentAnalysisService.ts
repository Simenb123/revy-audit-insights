import { logger } from '@/utils/logger';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { createTimeoutSignal } from '@/utils/networkHelpers';

export const getDocumentAnalyzerFunctionName = (): string => {
  return import.meta.env.VITE_USE_ENHANCED_ANALYSIS === 'true'
    ? 'enhanced-document-ai'
    : 'document-ai-analyzer';
};

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
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. Document analysis cannot proceed.");
    throw new Error("Supabase not initialized");
  }
  const functionName = getDocumentAnalyzerFunctionName();
  const useEnhanced = functionName === 'enhanced-document-ai';

  try {
    if (useEnhanced) {
      const { signal, clear } = createTimeoutSignal(20000);

    const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          document_text: input.extractedText,
          file_name: input.fileName,
          ...(input.clientId ? { client_id: input.clientId } : {}),
          variant_config: input.variant,
          audit_action_context: input.auditActionContext,
        },
        signal
      } as any);

      clear();

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

    const { signal, clear } = createTimeoutSignal(20000);

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        documentId: input.documentId,
        text: input.extractedText,
        fileName: input.fileName
      },
      signal
    } as any);

    clear();

    if (error) throw error;

    return {
      documentId: input.documentId,
      aiAnalysisSummary: data.analysis || ''
    } as DocumentAnalysisResult;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Tilkoblingen tok for lang tid, prøv igjen senere');
    }
    throw error;
  }
};

export const updateDocumentWithAnalysis = async (
  result: DocumentAnalysisResult
): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. Document update cannot proceed.");
    throw new Error("Supabase not initialized");
  }
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

