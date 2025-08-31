import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import type { AIRevyVariant } from '@/hooks/useAIRevyVariants';

export interface SmartContextSwitchingConfig {
  documentTypes: string[];
  riskLevel: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'medium' | 'complex';
  userRole: string;
  clientSize: 'small' | 'medium' | 'large';
}

export interface AIVariantRecommendation {
  variant: AIRevyVariant;
  confidence: number;
  reasoning: string;
  contextFactors: string[];
}

export const getSmartAIVariantRecommendation = async (
  context: string,
  config: Partial<SmartContextSwitchingConfig> = {},
  documentContext?: any
): Promise<AIVariantRecommendation | null> => {
  try {
    // Enhanced context analysis with document types and complexity
    const contextAnalysis = analyzeContext(context, config, documentContext);
    
    // Get available variants
    const { data: variants, error } = await supabase
      .from('ai_revy_variants')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      logger.error('Error fetching AI variants:', error);
      return null;
    }

    if (!variants || variants.length === 0) {
      return null;
    }

    // Smart variant selection based on enhanced context
    const recommendation = selectOptimalVariant(variants, contextAnalysis);
    
    logger.info('Smart AI variant recommendation:', {
      context,
      config,
      recommendation: {
        variant: recommendation.variant.name,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning
      }
    });

    return recommendation;

  } catch (error) {
    logger.error('Error in smart AI variant recommendation:', error);
    return null;
  }
};

const analyzeContext = (
  context: string, 
  config: Partial<SmartContextSwitchingConfig>,
  documentContext?: any
) => {
  const analysis = {
    primaryContext: context,
    documentTypes: config.documentTypes || [],
    riskLevel: config.riskLevel || 'medium',
    complexity: config.complexity || 'medium',
    userRole: config.userRole || 'employee',
    clientSize: config.clientSize || 'medium',
    hasFinancialData: false,
    hasLegalContent: false,
    requiresMethodology: false,
    requiresGuidance: false
  };

  // Analyze document context if provided
  if (documentContext) {
    analysis.hasFinancialData = detectFinancialContent(documentContext);
    analysis.hasLegalContent = detectLegalContent(documentContext);
  }

  // Context-specific analysis
  switch (context) {
    case 'audit-actions':
    case 'planning':
    case 'execution':
      analysis.requiresMethodology = true;
      analysis.complexity = 'complex';
      break;
    
    case 'risk-assessment':
    case 'client-detail':
      analysis.requiresMethodology = true;
      analysis.riskLevel = 'high';
      break;
    
    case 'documentation':
    case 'collaboration':
      analysis.requiresGuidance = true;
      break;
    
    case 'knowledge-base':
    case 'fag':
      analysis.requiresGuidance = true;
      analysis.hasLegalContent = true;
      break;
  }

  return analysis;
};

const selectOptimalVariant = (variants: any[], analysis: any): AIVariantRecommendation => {
  const scores = variants.map(variant => {
    let score = 0;
    const factors: string[] = [];
    
    // Base scoring by variant type
    switch (variant.name) {
      case 'methodology':
        if (analysis.requiresMethodology) {
          score += 40;
          factors.push('Krever revisjonsmetodikk');
        }
        if (analysis.riskLevel === 'high') {
          score += 20;
          factors.push('Høy risiko krever metodisk tilnærming');
        }
        if (analysis.complexity === 'complex') {
          score += 15;
          factors.push('Kompleks situasjon');
        }
        break;
      
      case 'professional':
        if (analysis.riskLevel === 'high') {
          score += 35;
          factors.push('Høy risiko');
        }
        if (analysis.hasFinancialData) {
          score += 25;
          factors.push('Finansielle data krever profesjonell analyse');
        }
        if (analysis.userRole === 'partner' || analysis.userRole === 'manager') {
          score += 10;
          factors.push('Senior rolle');
        }
        break;
      
      case 'guide':
        if (analysis.requiresGuidance) {
          score += 35;
          factors.push('Trenger veiledning');
        }
        if (analysis.hasLegalContent) {
          score += 20;
          factors.push('Juridisk innhold');
        }
        if (analysis.userRole === 'employee') {
          score += 15;
          factors.push('Junior rolle');
        }
        break;
      
      case 'support':
        // Always a fallback option
        score += 10;
        factors.push('Generell støtte');
        break;
    }

    // Document type bonuses
    if (analysis.documentTypes.includes('financial') && variant.name === 'professional') {
      score += 15;
      factors.push('Finansielle dokumenter');
    }
    
    if (analysis.documentTypes.includes('legal') && variant.name === 'guide') {
      score += 15;
      factors.push('Juridiske dokumenter');
    }

    // Client size considerations
    if (analysis.clientSize === 'large' && variant.name === 'methodology') {
      score += 10;
      factors.push('Stor klient krever strukturert tilnærming');
    }

    return {
      variant,
      score,
      factors
    };
  });

  // Sort by score and get the best
  const best = scores.sort((a, b) => b.score - a.score)[0];
  
  // Calculate confidence based on score gap
  const secondBest = scores[1];
  const scoreGap = best.score - (secondBest?.score || 0);
  const confidence = Math.min(0.95, 0.5 + (scoreGap / 100));

  return {
    variant: {
      id: best.variant.id,
      name: best.variant.name,
      display_name: best.variant.display_name,
      description: best.variant.description,
      system_prompt_template: best.variant.system_prompt_template,
      context_requirements: best.variant.context_requirements || {},
      available_contexts: best.variant.available_contexts || [],
      is_active: best.variant.is_active,
      sort_order: best.variant.sort_order || 0
    },
    confidence,
    reasoning: `Valgt basert på ${best.factors.join(', ').toLowerCase()}`,
    contextFactors: best.factors
  };
};

const detectFinancialContent = (documentContext: any): boolean => {
  if (!documentContext) return false;
  
  const indicators = [
    'regnskap', 'balanse', 'resultat', 'kontantstrøm', 'noter',
    'income', 'balance', 'cash flow', 'financial', 'accounting'
  ];
  
  const text = JSON.stringify(documentContext).toLowerCase();
  return indicators.some(indicator => text.includes(indicator));
};

const detectLegalContent = (documentContext: any): boolean => {
  if (!documentContext) return false;
  
  const indicators = [
    'lov', 'forskrift', 'paragraf', '§', 'juridisk', 'legal',
    'regnskapslov', 'revisorlov', 'aksjelov', 'contract', 'agreement'
  ];
  
  const text = JSON.stringify(documentContext).toLowerCase();
  return indicators.some(indicator => text.includes(indicator));
};