
import { supabase } from '@/integrations/supabase/client';
import { AIRevyVariant } from '@/hooks/useAIRevyVariants';
import { SubjectAreaMapping } from '@/hooks/useSubjectAreaMappings';

export interface DocumentAnalysisResult {
  documentId: string;
  aiSuggestedCategory: string;
  aiConfidenceScore: number;
  aiSuggestedSubjectAreas: string[];
  aiIsaStandardReferences: string[];
  aiRevisionPhaseRelevance: {
    planning: number;
    execution: number;
    completion: number;
  };
  aiAnalysisSummary: string;
  suggestedAuditActions: string[];
  riskAssessment: 'low' | 'medium' | 'high';
  missingRelatedDocuments: string[];
}

export interface DocumentAnalysisInput {
  documentId: string;
  fileName: string;
  extractedText?: string;
  clientId: string;
  variant?: AIRevyVariant;
  existingDocuments?: any[];
}

export const analyzeDocumentWithAI = async (
  input: DocumentAnalysisInput
): Promise<DocumentAnalysisResult> => {
  try {
    // Get document categories and subject area mappings
    const { data: categories } = await supabase
      .from('document_categories')
      .select('*');
    
    const { data: mappings } = await supabase
      .from('document_category_subject_area_mappings')
      .select('*');

    // Analyze file name patterns
    const fileAnalysis = analyzeFileName(input.fileName, categories || []);
    
    // Analyze content if available
    const contentAnalysis = input.extractedText 
      ? analyzeDocumentContent(input.extractedText, mappings || [])
      : null;

    // Combine analyses
    const combinedResult = combineAnalysisResults(fileAnalysis, contentAnalysis, mappings || []);
    
    // Generate AI summary and recommendations
    const aiEnhancedResult = await enhanceWithAIVariant(combinedResult, input);
    
    return aiEnhancedResult;
    
  } catch (error) {
    console.error('Document analysis failed:', error);
    return createFallbackResult(input.documentId, input.fileName);
  }
};

const analyzeFileName = (fileName: string, categories: any[]) => {
  const normalizedName = fileName.toLowerCase();
  let bestMatch = null;
  let confidence = 0.3; // Base confidence
  
  for (const category of categories) {
    if (category.expected_file_patterns) {
      for (const pattern of category.expected_file_patterns) {
        if (normalizedName.includes(pattern.toLowerCase())) {
          confidence = Math.max(confidence, 0.8);
          bestMatch = category;
          break;
        }
      }
    }
  }
  
  // Specific pattern matching
  if (normalizedName.includes('hovedbok') || normalizedName.includes('general_ledger')) {
    confidence = 0.95;
    bestMatch = categories.find(c => c.subject_area === 'hovedbok') || bestMatch;
  } else if (normalizedName.includes('saldo') || normalizedName.includes('trial_balance')) {
    confidence = 0.90;
    bestMatch = categories.find(c => c.subject_area === 'hovedbok') || bestMatch;
  } else if (normalizedName.includes('lønn') || normalizedName.includes('payroll')) {
    confidence = 0.85;
    bestMatch = categories.find(c => c.subject_area === 'lønn') || bestMatch;
  }
  
  return {
    category: bestMatch?.category_name || 'ukategorisert',
    confidence,
    subjectArea: bestMatch?.subject_area || 'other'
  };
};

const analyzeDocumentContent = (content: string, mappings: any[]) => {
  const normalizedContent = content.toLowerCase();
  const detectedElements = [];
  const isaReferences = [];
  
  // Look for ISA standard references
  const isaPattern = /isa\s*(\d+)/gi;
  const isaMatches = content.match(isaPattern);
  if (isaMatches) {
    isaReferences.push(...isaMatches);
  }
  
  // Look for financial terms
  const financialTerms = [
    'årsresultat', 'omsetning', 'egenkapital', 'gjeld',
    'eiendeler', 'avskrivninger', 'nedskrivninger', 'goodwill'
  ];
  
  const foundTerms = financialTerms.filter(term => 
    normalizedContent.includes(term)
  );
  
  // Determine subject areas based on content
  const subjectAreas = [];
  if (foundTerms.some(term => ['omsetning', 'salg'].includes(term))) {
    subjectAreas.push('sales');
  }
  if (foundTerms.some(term => ['lønn', 'personalkostand'].includes(term))) {
    subjectAreas.push('payroll');
  }
  if (foundTerms.some(term => ['bank', 'kontanter'].includes(term))) {
    subjectAreas.push('banking');
  }
  
  return {
    detectedElements: foundTerms,
    isaReferences,
    subjectAreas,
    contentQuality: foundTerms.length > 3 ? 'high' : foundTerms.length > 1 ? 'medium' : 'low'
  };
};

const combineAnalysisResults = (
  fileAnalysis: any,
  contentAnalysis: any,
  mappings: any[]
) => {
  const subjectAreas = [
    fileAnalysis.subjectArea,
    ...(contentAnalysis?.subjectAreas || [])
  ].filter((area, index, self) => self.indexOf(area) === index);
  
  // Find relevant mappings
  const relevantMappings = mappings.filter(m => 
    subjectAreas.includes(m.subject_area)
  );
  
  // Calculate confidence score
  let confidence = fileAnalysis.confidence;
  if (contentAnalysis && contentAnalysis.contentQuality === 'high') {
    confidence = Math.min(confidence + 0.2, 0.95);
  }
  
  // Get ISA standards
  const isaStandards = [
    ...(contentAnalysis?.isaReferences || []),
    ...relevantMappings.flatMap(m => m.isa_standards || [])
  ].filter((isa, index, self) => self.indexOf(isa) === index);
  
  // Calculate revision phase relevance
  const phaseRelevance = {
    planning: subjectAreas.includes('finance') ? 0.8 : 0.5,
    execution: 0.9, // Most documents are relevant for execution
    completion: subjectAreas.includes('finance') ? 0.9 : 0.6
  };
  
  return {
    category: fileAnalysis.category,
    confidence,
    subjectAreas,
    isaStandards,
    phaseRelevance,
    riskLevel: relevantMappings[0]?.risk_level || 'medium'
  };
};

const enhanceWithAIVariant = async (
  analysis: any,
  input: DocumentAnalysisInput
): Promise<DocumentAnalysisResult> => {
  // Generate AI-enhanced summary and recommendations
  const variant = input.variant;
  let aiSummary = `Dokumentet "${input.fileName}" er kategorisert som ${analysis.category}`;
  
  const suggestedActions = [];
  const missingDocuments = [];
  
  // Generate variant-specific recommendations
  if (variant?.name === 'methodology') {
    if (analysis.subjectAreas.includes('sales')) {
      suggestedActions.push('Gjennomfør salgscyklustest i henhold til ISA 315');
      suggestedActions.push('Verifiser omsetningsanerkjennelse per ISA 505');
      missingDocuments.push('Salgskontrakter', 'Fakturagrunnlag');
    }
    if (analysis.subjectAreas.includes('payroll')) {
      suggestedActions.push('Test lønnsberegninger i henhold til ISA 330');
      suggestedActions.push('Verifiser personalregistre per ISA 240');
      missingDocuments.push('Lønnsslipp', 'Personalkontrakter');
    }
  } else if (variant?.name === 'professional') {
    if (analysis.subjectAreas.includes('finance')) {
      suggestedActions.push('Vurder IFRS-regnskapsbehandling');
      suggestedActions.push('Kontroller konsistens med regnskapslovgivning');
    }
  }
  
  if (variant) {
    aiSummary += ` med ${Math.round(analysis.confidence * 100)}% sikkerhet. ${variant.display_name} anbefaler fokus på ${analysis.subjectAreas.join(', ')}.`;
  }
  
  return {
    documentId: input.documentId,
    aiSuggestedCategory: analysis.category,
    aiConfidenceScore: analysis.confidence,
    aiSuggestedSubjectAreas: analysis.subjectAreas,
    aiIsaStandardReferences: analysis.isaStandards,
    aiRevisionPhaseRelevance: analysis.phaseRelevance,
    aiAnalysisSummary: aiSummary,
    suggestedAuditActions: suggestedActions,
    riskAssessment: analysis.riskLevel as 'low' | 'medium' | 'high',
    missingRelatedDocuments: missingDocuments
  };
};

const createFallbackResult = (documentId: string, fileName: string): DocumentAnalysisResult => ({
  documentId,
  aiSuggestedCategory: 'ukategorisert',
  aiConfidenceScore: 0.3,
  aiSuggestedSubjectAreas: ['other'],
  aiIsaStandardReferences: [],
  aiRevisionPhaseRelevance: {
    planning: 0.5,
    execution: 0.5,
    completion: 0.5
  },
  aiAnalysisSummary: `Kunne ikke analysere "${fileName}" automatisk. Manuell gjennomgang anbefales.`,
  suggestedAuditActions: ['Gjennomgå dokumentet manuelt'],
  riskAssessment: 'medium',
  missingRelatedDocuments: []
});

export const updateDocumentWithAnalysis = async (
  result: DocumentAnalysisResult
): Promise<void> => {
  try {
    await supabase
      .from('client_documents_files')
      .update({
        ai_suggested_category: result.aiSuggestedCategory,
        ai_confidence_score: result.aiConfidenceScore,
        ai_suggested_subject_areas: result.aiSuggestedSubjectAreas,
        ai_isa_standard_references: result.aiIsaStandardReferences,
        ai_revision_phase_relevance: result.aiRevisionPhaseRelevance,
        ai_analysis_summary: result.aiAnalysisSummary,
        updated_at: new Date().toISOString()
      })
      .eq('id', result.documentId);
      
  } catch (error) {
    console.error('Failed to update document with analysis:', error);
    throw error;
  }
};
