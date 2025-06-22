
import { supabase } from '@/integrations/supabase/client';

export interface DocumentAnalysisInput {
  documentId: string;
  fileName: string;
  extractedText: string;
  clientId: string;
  variant?: any;
  auditActionContext?: {
    actionTemplateId?: string;
    subjectArea?: string;
    actionType?: string;
  };
}

export interface DocumentAnalysisResult {
  documentId: string;
  aiSuggestedCategory: string;
  aiConfidenceScore: number;
  aiAnalysisSummary: string;
  aiSuggestedSubjectAreas: string[];
  aiIsaStandardReferences: string[];
  relevantAuditActions: Array<{
    actionTemplateId: string;
    actionName: string;
    relevanceScore: number;
    suggestedUse: string;
  }>;
  qualityIndicators: {
    completeness: number;
    clarity: number;
    relevance: number;
    overall: number;
  };
  extractedKeyData: Record<string, any>;
}

export const analyzeDocumentWithAI = async (input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> => {
  console.log('🔍 Starting enhanced document analysis with audit action context...');
  
  try {
    const { data, error } = await supabase.functions.invoke('enhanced-document-ai', {
      body: {
        documentId: input.documentId,
        fileName: input.fileName,
        extractedText: input.extractedText,
        clientId: input.clientId,
        variant: input.variant,
        auditActionContext: input.auditActionContext,
        analysisType: 'comprehensive'
      }
    });

    if (error) throw error;

    console.log('✅ Enhanced document analysis completed');
    return data;
    
  } catch (error) {
    console.error('❌ Enhanced document analysis failed:', error);
    throw error;
  }
};

export const updateDocumentWithAnalysis = async (result: DocumentAnalysisResult): Promise<void> => {
  console.log('💾 Updating document with enhanced analysis results...');
  
  try {
    const { error } = await supabase
      .from('client_documents_files')
      .update({
        category: result.aiSuggestedCategory,
        ai_confidence_score: result.aiConfidenceScore,
        ai_analysis_summary: result.aiAnalysisSummary,
        ai_suggested_subject_areas: result.aiSuggestedSubjectAreas,
        ai_isa_standard_references: result.aiIsaStandardReferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', result.documentId);

    if (error) throw error;

    // Store detailed analysis results separately for audit action linking
    await supabase
      .from('document_analysis_results')
      .upsert({
        document_id: result.documentId,
        relevant_audit_actions: result.relevantAuditActions,
        quality_indicators: result.qualityIndicators,
        extracted_key_data: result.extractedKeyData,
        analysis_timestamp: new Date().toISOString()
      });

    console.log('✅ Document analysis results stored successfully');
    
  } catch (error) {
    console.error('❌ Failed to update document with analysis:', error);
    throw error;
  }
};
