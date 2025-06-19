
import { supabase } from '@/integrations/supabase/client';
import { AIRevyVariant } from '@/hooks/useAIRevyVariants';

export interface EnhancedAIContext {
  variant: AIRevyVariant;
  documentContext?: {
    categories: string[];
    subjectAreas: string[];
    isaStandards: string[];
    riskLevel: string;
    auditPhase: string;
    documentStats: {
      total: number;
      byCategory: Record<string, number>;
      qualityScore: number;
    };
  };
  clientContext?: {
    phase: string;
    industry: string;
    riskAreas: string[];
  };
  userContext?: {
    role: string;
    experience: string;
  };
}

export const buildEnhancedAIPrompt = (
  variant: AIRevyVariant,
  message: string,
  context: EnhancedAIContext
): string => {
  let prompt = variant.system_prompt_template;

  // Add document context if available
  if (context.documentContext) {
    const docContext = context.documentContext;
    prompt += `\n\nDOKUMENTKONTEKST:
- Fagområder: ${docContext.subjectAreas.join(', ')}
- ISA-standarder: ${docContext.isaStandards.join(', ')}
- Risikonivå: ${docContext.riskLevel}
- Revisjonsfase: ${docContext.auditPhase}
- Dokumentkvalitet: ${Math.round(docContext.qualityScore)}%
- Totalt dokumenter: ${docContext.total}`;
  }

  // Add client context if available
  if (context.clientContext) {
    const clientCtx = context.clientContext;
    prompt += `\n\nKLIENTKONTEKST:
- Revisjonsfase: ${clientCtx.phase}
- Bransje: ${clientCtx.industry}
- Risikoområder: ${clientCtx.riskAreas.join(', ')}`;
  }

  // Variant-specific context additions
  switch (variant.name) {
    case 'methodology':
      prompt += `\n\nFokuser på ISA-standarder, revisjonsmetodikk og kvalitetssikring. Gi konkrete prosedyrer og referanser.`;
      break;
    case 'professional':
      prompt += `\n\nFokuser på regnskapslovgivning, IFRS/NGRS og bransjeforhold. Gi faglige tolkninger og veiledning.`;
      break;
    case 'guide':
      prompt += `\n\nFokuser på pedagogisk forklaring og praktiske tips. Hjelp brukeren å forstå og lære.`;
      break;
    case 'support':
      prompt += `\n\nFokuser på systemhjelp, tekniske spørsmål og arbeidsflyt. Gi klare instruksjoner.`;
      break;
  }

  prompt += `\n\nBRUKERSPØRSMÅL: ${message}`;

  return prompt;
};

export const getOptimalVariantForContext = async (
  context: string,
  documentTypes?: string[]
): Promise<string> => {
  // Context-based variant selection logic
  const contextMapping: Record<string, string> = {
    'audit-actions': 'methodology',
    'planning': 'methodology',
    'execution': 'methodology', 
    'completion': 'methodology',
    'risk-assessment': 'professional',
    'client-detail': 'professional',
    'documentation': 'guide',
    'collaboration': 'guide',
    'general': 'support'
  };

  // Document type based refinement
  if (documentTypes && documentTypes.length > 0) {
    const hasFinancialDocs = documentTypes.some(type => 
      ['hovedbok', 'saldobalanse', 'resultatregnskap'].includes(type)
    );
    
    if (hasFinancialDocs && context === 'client-detail') {
      return 'methodology'; // Use methodology for financial document analysis
    }
  }

  return contextMapping[context] || 'support';
};
