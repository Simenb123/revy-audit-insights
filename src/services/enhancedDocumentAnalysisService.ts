
import { supabase } from '@/integrations/supabase/client';
import { useSubjectAreaMappings } from '@/hooks/useSubjectAreaMappings';

export interface EnhancedDocumentAnalysis {
  documentId: string;
  suggestedSubjectAreas: string[];
  isaStandardReferences: string[];
  revisionPhaseRelevance: {
    planning: number;
    execution: number;
    completion: number;
  };
  qualityScore: number;
  missingDocumentSuggestions: string[];
  auditActionRecommendations: string[];
}

export const analyzeDocumentWithEnhancedContext = async (
  clientId: string,
  documents: any[]
): Promise<EnhancedDocumentAnalysis[]> => {
  const analyses: EnhancedDocumentAnalysis[] = [];

  for (const document of documents) {
    const analysis = await performEnhancedDocumentAnalysis(clientId, document);
    analyses.push(analysis);
  }

  return analyses;
};

const performEnhancedDocumentAnalysis = async (
  clientId: string,
  document: any
): Promise<EnhancedDocumentAnalysis> => {
  // Get subject area mappings
  const { data: mappings } = await supabase
    .from('document_category_subject_area_mappings')
    .select('*')
    .eq('subject_area', document.subject_area || 'other');

  const mapping = mappings?.[0];
  
  // Analyze document context
  const suggestedSubjectAreas = inferSubjectAreas(document);
  const isaStandardReferences = mapping?.isa_standards || inferISAStandards(document);
  const revisionPhaseRelevance = calculatePhaseRelevance(document, mapping);
  
  // Generate recommendations
  const missingDocumentSuggestions = await generateMissingDocumentSuggestions(clientId, document);
  const auditActionRecommendations = generateAuditActionRecommendations(document, mapping);

  return {
    documentId: document.id,
    suggestedSubjectAreas,
    isaStandardReferences,
    revisionPhaseRelevance,
    qualityScore: document.ai_confidence_score || 0,
    missingDocumentSuggestions,
    auditActionRecommendations
  };
};

const inferSubjectAreas = (document: any): string[] => {
  const fileName = document.file_name.toLowerCase();
  const category = document.category?.toLowerCase() || '';
  const areas: string[] = [];

  // Pattern matching for subject areas
  if (fileName.includes('hovedbok') || fileName.includes('general_ledger')) {
    areas.push('finance');
  }
  if (fileName.includes('lønn') || fileName.includes('payroll')) {
    areas.push('payroll');
  }
  if (fileName.includes('salg') || fileName.includes('sales') || fileName.includes('omsetning')) {
    areas.push('sales');
  }
  if (fileName.includes('bank') || fileName.includes('kontoutskrift')) {
    areas.push('banking');
  }
  if (fileName.includes('lager') || fileName.includes('inventory')) {
    areas.push('inventory');
  }

  return areas.length > 0 ? areas : ['other'];
};

const inferISAStandards = (document: any): string[] => {
  const subjectAreas = inferSubjectAreas(document);
  const standards: string[] = [];

  subjectAreas.forEach(area => {
    switch (area) {
      case 'finance':
        standards.push('ISA 315', 'ISA 330', 'ISA 500');
        break;
      case 'payroll':
        standards.push('ISA 315', 'ISA 330', 'ISA 240');
        break;
      case 'sales':
        standards.push('ISA 240', 'ISA 315', 'ISA 330', 'ISA 505');
        break;
      case 'banking':
        standards.push('ISA 330', 'ISA 505', 'ISA 501');
        break;
      default:
        standards.push('ISA 315', 'ISA 330');
    }
  });

  return [...new Set(standards)]; // Remove duplicates
};

const calculatePhaseRelevance = (document: any, mapping: any) => {
  const fileName = document.file_name.toLowerCase();
  
  let planning = 0.3; // Base relevance
  let execution = 0.7; // Most documents are relevant in execution
  let completion = 0.4; // Some relevance in completion

  // Adjust based on document type
  if (fileName.includes('årsoppgjør') || fileName.includes('year_end')) {
    completion = 0.9;
    execution = 0.8;
  }
  
  if (fileName.includes('budsjett') || fileName.includes('budget')) {
    planning = 0.9;
    execution = 0.5;
  }

  if (fileName.includes('hovedbok') || fileName.includes('saldobalanse')) {
    execution = 0.9;
    completion = 0.8;
  }

  return { planning, execution, completion };
};

const generateMissingDocumentSuggestions = async (
  clientId: string,
  document: any
): Promise<string[]> => {
  const suggestions: string[] = [];
  const subjectAreas = inferSubjectAreas(document);

  // Get existing documents for client
  const { data: existingDocs } = await supabase
    .from('client_documents_files')
    .select('category, subject_area')
    .eq('client_id', clientId);

  const existingCategories = new Set(existingDocs?.map(d => d.category) || []);

  // Suggest missing documents based on subject area
  subjectAreas.forEach(area => {
    switch (area) {
      case 'finance':
        if (!existingCategories.has('Saldobalanse')) {
          suggestions.push('Saldobalanse mangler for komplett finansiell oversikt');
        }
        if (!existingCategories.has('Hovedbok')) {
          suggestions.push('Hovedbok trengs for detaljert transaksjonsanalyse');
        }
        break;
      case 'payroll':
        if (!existingCategories.has('Feriepengeliste')) {
          suggestions.push('Feriepengeliste mangler for lønnsgransking');
        }
        if (!existingCategories.has('A07 avstemming')) {
          suggestions.push('A07 avstemming trengs for lønnsrapportering');
        }
        break;
    }
  });

  return suggestions;
};

const generateAuditActionRecommendations = (document: any, mapping: any): string[] => {
  const recommendations: string[] = [];
  const subjectAreas = inferSubjectAreas(document);

  subjectAreas.forEach(area => {
    switch (area) {
      case 'finance':
        recommendations.push('Utfør analytisk gjennomgang av hovedpostene');
        recommendations.push('Kontroller kontoavstemming for balanseposter');
        break;
      case 'payroll':
        recommendations.push('Verifiser lønnsberegninger og trekk');
        recommendations.push('Kontroller feriepengeberegning');
        break;
      case 'sales':
        recommendations.push('Test inntektskuttoff procedures');
        recommendations.push('Analyser omsetningsvariasjoner');
        break;
    }
  });

  return recommendations;
};

// Update document with enhanced analysis
export const updateDocumentWithEnhancedAnalysis = async (
  documentId: string,
  analysis: EnhancedDocumentAnalysis
): Promise<void> => {
  await supabase
    .from('client_documents_files')
    .update({
      ai_suggested_subject_areas: analysis.suggestedSubjectAreas,
      ai_isa_standard_references: analysis.isaStandardReferences,
      ai_revision_phase_relevance: analysis.revisionPhaseRelevance
    })
    .eq('id', documentId);
};
