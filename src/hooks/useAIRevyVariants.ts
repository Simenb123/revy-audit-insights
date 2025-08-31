import { logger } from '@/utils/logger';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AIRevyVariantName } from '@/constants/aiRevyVariants';
import { getSmartAIVariantRecommendation, type SmartContextSwitchingConfig } from '@/services/enhancedAIVariantService';
import { enhanceAIPromptWithISAContext, getRelevantISAStandards, type SemanticContext } from '@/services/isaSemanticService';
import { AdvancedContextAnalyzer } from '@/services/advancedContextAnalyzer';
import type { RevyContext } from '@/types/revio';

export interface AIRevyVariant {
  id: string;
  name: AIRevyVariantName;
  display_name: string;
  description: string;
  system_prompt_template: string;
  context_requirements: Record<string, any>;
  available_contexts: string[];
  is_active: boolean;
  sort_order: number;
}

export const useAIRevyVariants = (context?: string, userRole?: string, documentContext?: any) => {
  const [variants, setVariants] = useState<AIRevyVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<AIRevyVariant | null>(null);
  const [smartRecommendation, setSmartRecommendation] = useState<any>(null);
  const [isaContext, setIsaContext] = useState<string>('');
  const [contextAnalysis, setContextAnalysis] = useState<any>(null);
  const [contextAnalyzer] = useState(() => new AdvancedContextAnalyzer());

  useEffect(() => {
    loadVariants();
  }, [context, userRole, documentContext]);

  const loadVariants = async () => {
    try {
      let query = supabase
        .from('ai_revy_variants')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (context) {
        query = query.contains('available_contexts', [context]);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform database data to match interface
      const transformedData: AIRevyVariant[] = data?.map(item => ({
        id: item.id,
        name: item.name as AIRevyVariantName,
        display_name: item.display_name,
        description: item.description || '',
        system_prompt_template: item.system_prompt_template,
        context_requirements: item.context_requirements as Record<string, any> || {},
        available_contexts: item.available_contexts || [],
        is_active: item.is_active || false,
        sort_order: item.sort_order || 0
      })) || [];
      
      setVariants(transformedData);
      
      // Auto-select most appropriate variant based on context
      if (transformedData && transformedData.length > 0 && !selectedVariant) {
        // Use advanced context analysis
        try {
          const analysis = await contextAnalyzer.analyzeContext({
            currentContext: (context as RevyContext) || 'general',
            userRole: userRole || 'employee',
            documentContext,
            clientData: undefined, // This would be passed from parent if available
            sessionHistory: [], // This would contain previous messages if available
            recentActivity: []
          });
          
          setContextAnalysis(analysis);
          
          // Use the analysis to get smart variant recommendation
          const smartConfig: Partial<SmartContextSwitchingConfig> = {
            userRole: analysis.userBehaviorPatterns.expertiseLevel,
            documentTypes: analysis.documentInsights.types,
            complexity: analysis.documentInsights.complexity === 'low' ? 'simple' : 
                       analysis.documentInsights.complexity === 'high' ? 'complex' : 'medium',
            riskLevel: analysis.documentInsights.riskLevel
          };

          const recommendation = await getSmartAIVariantRecommendation(
            context || 'general', 
            smartConfig, 
            documentContext
          );
          
          // Generate enhanced ISA context
          const semanticContext: SemanticContext = {
            documentContext,
            auditPhase: analysis.documentInsights.auditPhase as any,
            riskLevel: analysis.documentInsights.riskLevel,
            accountCategories: [] // This would be derived from documentContext if needed
          };
          
          const relevantISAs = getRelevantISAStandards(semanticContext);
          const isaPrompt = relevantISAs.length > 0 
            ? `Relevante ISA standarder: ${relevantISAs.map(isa => isa.isa_number).join(', ')}`
            : '';
          
          setIsaContext(isaPrompt);
          
          if (recommendation && recommendation.confidence > 0.6) {
            setSmartRecommendation(recommendation);
            setSelectedVariant(recommendation.variant);
            logger.info('Advanced AI variant selected with context analysis:', {
              variant: recommendation.variant.name,
              confidence: recommendation.confidence,
              reasoning: recommendation.reasoning,
              contextAnalysis: `${analysis.primaryContext} (${analysis.contextConfidence}% confidence)`,
              isaStandards: relevantISAs.map(isa => isa.isa_number)
            });
          } else {
            // Fallback to legacy selection
            const defaultVariant = selectDefaultVariant(transformedData, context);
            setSelectedVariant(defaultVariant);
          }
        } catch (error) {
          logger.error('Smart variant selection failed, using fallback:', error);
          const defaultVariant = selectDefaultVariant(transformedData, context);
          setSelectedVariant(defaultVariant);
        }
      }
    } catch (error) {
      logger.error('Error loading AI-Revy variants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectDefaultVariant = (availableVariants: AIRevyVariant[], currentContext?: string): AIRevyVariant => {
    if (!currentContext) return availableVariants[0];

    // Context-based variant selection
    const contextMapping: Record<string, AIRevyVariantName> = {
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

    const preferredVariantName = contextMapping[currentContext];
    const preferred = availableVariants.find(v => v.name === preferredVariantName);
    
    return preferred || availableVariants[0];
  };

  // Helper functions for smart context analysis
  const detectDocumentTypes = (documentContext: any): string[] => {
    if (!documentContext) return [];
    const text = JSON.stringify(documentContext).toLowerCase();
    const types = [];
    if (text.includes('regnskap') || text.includes('financial')) types.push('financial');
    if (text.includes('juridisk') || text.includes('legal')) types.push('legal');
    if (text.includes('revisjon') || text.includes('audit')) types.push('audit');
    return types;
  };

  const detectComplexity = (context?: string): 'simple' | 'medium' | 'complex' => {
    if (!context) return 'medium';
    const complexContexts = ['audit-actions', 'risk-assessment', 'planning'];
    return complexContexts.includes(context) ? 'complex' : 'medium';
  };

  const detectRiskLevel = (context?: string): 'low' | 'medium' | 'high' => {
    if (!context) return 'medium';
    const highRiskContexts = ['risk-assessment', 'client-detail'];
    return highRiskContexts.includes(context) ? 'high' : 'medium';
  };

  const detectAuditPhase = (context?: string): 'planning' | 'execution' | 'completion' => {
    if (!context) return 'execution';
    if (context.includes('planning') || context.includes('risk-assessment')) return 'planning';
    if (context.includes('completion') || context.includes('reporting')) return 'completion';
    return 'execution';
  };

  const detectAccountCategories = (documentContext: any): string[] => {
    if (!documentContext) return [];
    const text = JSON.stringify(documentContext).toLowerCase();
    const categories = [];
    if (text.includes('omsetning') || text.includes('salg')) categories.push('revenue');
    if (text.includes('kostnad') || text.includes('utgift')) categories.push('expenses');
    if (text.includes('varelager') || text.includes('beholdning')) categories.push('inventory');
    if (text.includes('kunde') || text.includes('fordring')) categories.push('receivables');
    if (text.includes('leverandør') || text.includes('gjeld')) categories.push('payables');
    return categories;
  };

  const switchVariant = (variant: AIRevyVariant) => {
    setSelectedVariant(variant);
  };

  const handleVariantChange = (variant: AIRevyVariant) => {
    switchVariant(variant);
  };

  return {
    variants,
    selectedVariant,
    isLoading,
    switchVariant,
    handleVariantChange,
    loadVariants,
    smartRecommendation,
    isaContext,
    contextAnalysis,
    contextAnalyzer
  };
};
