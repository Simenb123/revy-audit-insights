import { logger } from '@/utils/logger';
import { advancedContextAnalyzer, type AdvancedContextAnalysis } from './advancedContextAnalyzer';
import { getSmartAIVariantRecommendation } from './enhancedAIVariantService';
import { buildEnhancedAIPrompt, type EnhancedAIContext } from './aiRevyVariantService';
import type { AIRevyVariant } from '@/hooks/useAIRevyVariants';
import type { RevyContext } from '@/types/revio';

export interface PromptEnhancementConfig {
  includeISAReferences: boolean;
  includePreviousContext: boolean;
  adaptToUserLevel: boolean;
  includeRiskAssessment: boolean;
  includeActionableInsights: boolean;
}

export interface EnhancedPromptResult {
  enhancedPrompt: string;
  contextAnalysis: AdvancedContextAnalysis;
  recommendedVariant: AIRevyVariant | null;
  confidenceScore: number;
  enhancementApplied: string[];
  suggestedFollowUps: string[];
}

export class ContextAwarePromptEnhancer {
  private static instance: ContextAwarePromptEnhancer;
  private enhancementHistory: Map<string, EnhancedPromptResult[]> = new Map();

  static getInstance(): ContextAwarePromptEnhancer {
    if (!ContextAwarePromptEnhancer.instance) {
      ContextAwarePromptEnhancer.instance = new ContextAwarePromptEnhancer();
    }
    return ContextAwarePromptEnhancer.instance;
  }

  async enhancePrompt(
    originalPrompt: string,
    context: RevyContext,
    currentVariant: AIRevyVariant,
    config: Partial<PromptEnhancementConfig> = {},
    additionalContext?: {
      clientData?: any;
      documentContext?: any;
      userRole?: string;
      sessionHistory?: any[];
      recentActivity?: any[];
    }
  ): Promise<EnhancedPromptResult> {
    try {
      const startTime = performance.now();
      
      // Default configuration
      const enhancementConfig: PromptEnhancementConfig = {
        includeISAReferences: true,
        includePreviousContext: true,
        adaptToUserLevel: true,
        includeRiskAssessment: true,
        includeActionableInsights: true,
        ...config
      };

      // Step 1: Analyze current context comprehensively
      const contextAnalysis = await advancedContextAnalyzer.analyzeContext({
        currentContext: context,
        clientData: additionalContext?.clientData,
        documentContext: additionalContext?.documentContext,
        userRole: additionalContext?.userRole,
        recentActivity: additionalContext?.recentActivity,
        sessionHistory: additionalContext?.sessionHistory
      });

      // Step 2: Get smart variant recommendation
      const variantRecommendation = await getSmartAIVariantRecommendation(
        context,
        {
          documentTypes: contextAnalysis.documentInsights.types,
          riskLevel: contextAnalysis.documentInsights.riskLevel,
          complexity: this.mapComplexityToVariantService(contextAnalysis.documentInsights.complexity),
          userRole: additionalContext?.userRole || 'employee',
          clientSize: contextAnalysis.clientInsights.size
        },
        additionalContext?.documentContext
      );

      // Step 3: Select optimal variant (recommended or current)
      const optimalVariant = this.selectOptimalVariant(
        currentVariant,
        variantRecommendation?.variant,
        contextAnalysis
      );

      // Step 4: Build enhanced AI context
      const enhancedAIContext: EnhancedAIContext = {
        variant: optimalVariant,
        documentContext: {
          categories: contextAnalysis.documentInsights.types,
          subjectAreas: this.extractSubjectAreas(contextAnalysis),
          isaStandards: contextAnalysis.documentInsights.isaRelevance,
          riskLevel: contextAnalysis.documentInsights.riskLevel,
          auditPhase: contextAnalysis.documentInsights.auditPhase,
          documentStats: {
            total: additionalContext?.documentContext?.total || 0,
            byCategory: additionalContext?.documentContext?.byCategory || {},
            qualityScore: this.calculateDocumentQualityScore(contextAnalysis)
          }
        },
        clientContext: {
          phase: contextAnalysis.documentInsights.auditPhase,
          industry: contextAnalysis.clientInsights.industry,
          riskAreas: this.extractRiskAreas(contextAnalysis)
        },
        userContext: {
          role: additionalContext?.userRole || 'employee',
          experience: contextAnalysis.userBehaviorPatterns.expertiseLevel
        }
      };

      // Step 5: Build base enhanced prompt
      let enhancedPrompt = buildEnhancedAIPrompt(optimalVariant, originalPrompt, enhancedAIContext);

      // Step 6: Apply additional enhancements based on configuration
      const enhancementApplied: string[] = [];
      
      if (enhancementConfig.includeISAReferences && contextAnalysis.documentInsights.isaRelevance.length > 0) {
        enhancedPrompt = this.addISAReferences(enhancedPrompt, contextAnalysis.documentInsights.isaRelevance);
        enhancementApplied.push('ISA-referanser');
      }

      if (enhancementConfig.includePreviousContext && additionalContext?.sessionHistory) {
        enhancedPrompt = this.addContextualHistory(enhancedPrompt, additionalContext.sessionHistory);
        enhancementApplied.push('Samtalehistorikk');
      }

      if (enhancementConfig.adaptToUserLevel) {
        enhancedPrompt = this.adaptToUserExpertise(
          enhancedPrompt, 
          contextAnalysis.userBehaviorPatterns.expertiseLevel,
          contextAnalysis.userBehaviorPatterns.preferredInteractionStyle
        );
        enhancementApplied.push('Brukertilpassning');
      }

      if (enhancementConfig.includeRiskAssessment && contextAnalysis.documentInsights.riskLevel !== 'low') {
        enhancedPrompt = this.addRiskAssessmentGuidance(enhancedPrompt, contextAnalysis);
        enhancementApplied.push('Risikovurdering');
      }

      if (enhancementConfig.includeActionableInsights && contextAnalysis.recommendedActions.length > 0) {
        enhancedPrompt = this.addActionableInsights(enhancedPrompt, contextAnalysis.recommendedActions);
        enhancementApplied.push('Handlingsrettede innsikter');
      }

      // Step 7: Generate suggested follow-ups
      const suggestedFollowUps = this.generateFollowUpSuggestions(contextAnalysis, originalPrompt);

      // Step 8: Calculate overall confidence score
      const confidenceScore = this.calculateOverallConfidence(
        contextAnalysis.contextConfidence,
        variantRecommendation?.confidence || 0.5,
        enhancementApplied.length
      );

      const result: EnhancedPromptResult = {
        enhancedPrompt,
        contextAnalysis,
        recommendedVariant: optimalVariant,
        confidenceScore,
        enhancementApplied,
        suggestedFollowUps
      };

      // Store in history for future reference
      this.storeEnhancementHistory(context, result);

      const executionTime = performance.now() - startTime;
      logger.info('Prompt enhancement completed', {
        originalLength: originalPrompt.length,
        enhancedLength: enhancedPrompt.length,
        enhancementsApplied: enhancementApplied.length,
        confidenceScore,
        executionTimeMs: Math.round(executionTime)
      });

      return result;

    } catch (error) {
      logger.error('Error in prompt enhancement:', error);
      return this.getDefaultEnhancedResult(originalPrompt, context, currentVariant);
    }
  }

  private selectOptimalVariant(
    currentVariant: AIRevyVariant,
    recommendedVariant: AIRevyVariant | undefined,
    contextAnalysis: AdvancedContextAnalysis
  ): AIRevyVariant {
    // If we have a high-confidence recommendation, use it
    if (recommendedVariant && contextAnalysis.contextConfidence > 0.7) {
      return recommendedVariant;
    }

    // Check if current variant is suitable for the context
    const isCurrentVariantSuitable = this.isVariantSuitableForContext(currentVariant, contextAnalysis);
    
    if (isCurrentVariantSuitable) {
      return currentVariant;
    }

    // Fall back to recommended variant or current variant
    return recommendedVariant || currentVariant;
  }

  private isVariantSuitableForContext(variant: AIRevyVariant, analysis: AdvancedContextAnalysis): boolean {
    // Check if variant matches context requirements
    const variantCapabilities = this.getVariantCapabilities(variant.name);
    const contextRequirements = this.getContextRequirements(analysis);
    
    return contextRequirements.every(req => variantCapabilities.includes(req));
  }

  private getVariantCapabilities(variantName: string): string[] {
    const capabilities: Record<string, string[]> = {
      'methodology': ['isa_standards', 'procedures', 'quality_control', 'risk_assessment'],
      'professional': ['accounting_standards', 'legal_guidance', 'industry_expertise', 'complex_analysis'],
      'guide': ['educational', 'step_by_step', 'practical_tips', 'beginner_friendly'],
      'support': ['technical_help', 'system_guidance', 'workflow_support', 'general_assistance']
    };

    return capabilities[variantName] || ['general_assistance'];
  }

  private getContextRequirements(analysis: AdvancedContextAnalysis): string[] {
    const requirements: string[] = [];

    if (analysis.documentInsights.riskLevel === 'high') {
      requirements.push('risk_assessment');
    }

    if (analysis.documentInsights.complexity === 'high') {
      requirements.push('complex_analysis');
    }

    if (analysis.documentInsights.isaRelevance.length > 0) {
      requirements.push('isa_standards');
    }

    if (analysis.userBehaviorPatterns.expertiseLevel === 'junior') {
      requirements.push('educational');
    }

    return requirements;
  }

  private extractSubjectAreas(analysis: AdvancedContextAnalysis): string[] {
    const areas: string[] = [];
    
    // Extract from document types
    analysis.documentInsights.types.forEach(type => {
      switch (type) {
        case 'balanse':
        case 'resultat':
          areas.push('finansiell rapportering');
          break;
        case 'hovedbok':
          areas.push('regnskapsdata');
          break;
        case 'noter':
          areas.push('noteopplysninger');
          break;
        case 'kontantstrøm':
          areas.push('kontantstrømanalyse');
          break;
      }
    });

    // Add context-specific areas
    switch (analysis.primaryContext) {
      case 'risk-assessment':
        areas.push('risikovurdering');
        break;
      case 'audit-actions':
        areas.push('revisjonshandlinger');
        break;
      case 'documentation':
        areas.push('dokumentasjon');
        break;
    }

    return [...new Set(areas)];
  }

  private extractRiskAreas(analysis: AdvancedContextAnalysis): string[] {
    const riskAreas: string[] = [];

    if (analysis.documentInsights.riskLevel === 'high') {
      riskAreas.push('høyrisiko dokumenter');
    }

    if (analysis.clientInsights.riskProfile === 'high') {
      riskAreas.push('høyrisiko klient');
    }

    if (analysis.documentInsights.complexity === 'high') {
      riskAreas.push('komplekse transaksjoner');
    }

    // Industry-specific risks
    const industryRisks: Record<string, string[]> = {
      'finance': ['kredittrisiko', 'markedsrisiko', 'operasjonell risiko'],
      'construction': ['prosjektrisiko', 'kontraktrisiko', 'anleggsrisiko'],
      'technology': ['teknologirisiko', 'cybersikkerhet', 'immaterielle rettigheter']
    };

    const clientIndustryRisks = industryRisks[analysis.clientInsights.industry.toLowerCase()];
    if (clientIndustryRisks) {
      riskAreas.push(...clientIndustryRisks);
    }

    return [...new Set(riskAreas)];
  }

  private calculateDocumentQualityScore(analysis: AdvancedContextAnalysis): number {
    let score = 50; // Base score

    // Increase score based on available information
    if (analysis.documentInsights.types.length > 0) score += 20;
    if (analysis.documentInsights.isaRelevance.length > 0) score += 15;
    if (analysis.documentInsights.auditPhase !== 'unknown') score += 10;
    if (analysis.contextConfidence > 0.7) score += 5;

    return Math.min(100, score);
  }

  private addISAReferences(prompt: string, isaStandards: string[]): string {
    if (isaStandards.length === 0) return prompt;

    const isaSection = `\n\nRELEVANTE ISA-STANDARDER:\n${isaStandards.map(isa => `- ${isa}`).join('\n')}\n\nTa hensyn til disse standardene i ditt svar og referer til dem der det er relevant.`;

    return prompt + isaSection;
  }

  private addContextualHistory(prompt: string, sessionHistory: any[]): string {
    if (!sessionHistory || sessionHistory.length === 0) return prompt;

    const recentContext = sessionHistory.slice(-3).map(session => 
      `${session.context}: ${session.summary || 'Ingen sammendrag'}`
    ).join('\n');

    const historySection = `\n\nSAMTALEKONTEKST:\n${recentContext}\n\nTa hensyn til denne konteksten for å gi mer sammenhengede svar.`;

    return prompt + historySection;
  }

  private adaptToUserExpertise(
    prompt: string, 
    expertiseLevel: 'junior' | 'senior' | 'expert',
    interactionStyle: 'detailed' | 'concise' | 'guided'
  ): string {
    let adaptationSection = '\n\nBRUKERTILPASNING:\n';

    switch (expertiseLevel) {
      case 'junior':
        adaptationSection += '- Gi pedagogiske forklaringer og definer fagtermer\n';
        adaptationSection += '- Inkluder praktiske eksempler og referanser\n';
        break;
      case 'senior':
        adaptationSection += '- Fokuser på faglige tolkninger og vurderinger\n';
        adaptationSection += '- Anta kunnskap om grunnleggende revisjonsmetoder\n';
        break;
      case 'expert':
        adaptationSection += '- Gi avanserte faglige innsikter og komplekse analyser\n';
        adaptationSection += '- Fokuser på nyanserte vurderinger og edge cases\n';
        break;
    }

    switch (interactionStyle) {
      case 'detailed':
        adaptationSection += '- Gi omfattende og detaljerte svar\n';
        break;
      case 'concise':
        adaptationSection += '- Hold svarene korte og konsise\n';
        break;
      case 'guided':
        adaptationSection += '- Strukturer svaret i tydelige steg\n';
        break;
    }

    return prompt + adaptationSection;
  }

  private addRiskAssessmentGuidance(prompt: string, analysis: AdvancedContextAnalysis): string {
    const riskSection = `\n\nRISIKOVURDERING:\n- Dokumentrisiko: ${analysis.documentInsights.riskLevel}\n- Klientrisiko: ${analysis.clientInsights.riskProfile}\n- Kompleksitet: ${analysis.documentInsights.complexity}\n\nVurder disse risikofaktorene i ditt svar og gi spesifikke anbefalinger for risikohåndtering.`;

    return prompt + riskSection;
  }

  private addActionableInsights(prompt: string, recommendedActions: string[]): string {
    if (recommendedActions.length === 0) return prompt;

    const actionsSection = `\n\nANBEFALTE HANDLINGER:\n${recommendedActions.map(action => `- ${action}`).join('\n')}\n\nInkluder konkrete handlingsanbefalinger basert på konteksten.`;

    return prompt + actionsSection;
  }

  private generateFollowUpSuggestions(analysis: AdvancedContextAnalysis, originalPrompt: string): string[] {
    const suggestions: string[] = [];

    // Context-specific follow-ups
    switch (analysis.primaryContext) {
      case 'risk-assessment':
        suggestions.push('Hvilke kontroller bør implementeres for de identifiserte risikoene?');
        suggestions.push('Hvordan kan vi kvantifisere disse risikoene?');
        break;
      case 'audit-actions':
        suggestions.push('Hvilke dokumenter trenger vi for å gjennomføre disse handlingene?');
        suggestions.push('Hvor mye tid bør vi budsjettere for disse prosedyrene?');
        break;
      case 'documentation':
        suggestions.push('Hvilke kvalitetskontroller bør vi gjennomføre?');
        suggestions.push('Hvordan kan vi sikre fullstendighet i dokumentasjonen?');
        break;
    }

    // Risk-based follow-ups
    if (analysis.documentInsights.riskLevel === 'high') {
      suggestions.push('Hvilke ytterligere prosedyrer anbefales for høyrisiko områder?');
    }

    // ISA-based follow-ups
    if (analysis.documentInsights.isaRelevance.length > 0) {
      suggestions.push(`Hvilke krav stiller ${analysis.documentInsights.isaRelevance[0]} til denne situasjonen?`);
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private calculateOverallConfidence(
    contextConfidence: number,
    variantConfidence: number,
    enhancementCount: number
  ): number {
    let confidence = (contextConfidence + variantConfidence) / 2;
    
    // Boost confidence based on applied enhancements
    confidence += enhancementCount * 0.05;
    
    return Math.min(0.95, confidence);
  }

  private storeEnhancementHistory(context: RevyContext, result: EnhancedPromptResult): void {
    const key = context;
    const history = this.enhancementHistory.get(key) || [];
    
    history.push(result);
    
    // Keep only last 10 enhancements per context
    if (history.length > 10) {
      history.shift();
    }
    
    this.enhancementHistory.set(key, history);
  }

  private getDefaultEnhancedResult(
    originalPrompt: string,
    context: RevyContext,
    currentVariant: AIRevyVariant
  ): EnhancedPromptResult {
    return {
      enhancedPrompt: originalPrompt,
      contextAnalysis: {
        primaryContext: context,
        contextConfidence: 0.5,
        documentInsights: {
          types: [],
          complexity: 'medium',
          riskLevel: 'medium',
          auditPhase: 'unknown',
          isaRelevance: []
        },
        userBehaviorPatterns: {
          frequentContexts: ['general'],
          expertiseLevel: 'junior',
          preferredInteractionStyle: 'guided'
        },
        clientInsights: {
          industry: 'unknown',
          size: 'medium',
          riskProfile: 'medium',
          auditHistoryComplexity: 0.5
        },
        recommendedActions: [],
        contextSwitchingRules: []
      },
      recommendedVariant: currentVariant,
      confidenceScore: 0.5,
      enhancementApplied: [],
      suggestedFollowUps: ['Kan du gi mer spesifikk informasjon?']
    };
  }

  // Public method to get enhancement history
  getEnhancementHistory(context: RevyContext): EnhancedPromptResult[] {
    return this.enhancementHistory.get(context) || [];
  }

  // Public method to clear enhancement history
  clearEnhancementHistory(context?: RevyContext): void {
    if (context) {
      this.enhancementHistory.delete(context);
    } else {
      this.enhancementHistory.clear();
    }
  }

  // Helper method to map complexity types
  private mapComplexityToVariantService(complexity: 'low' | 'medium' | 'high'): 'simple' | 'medium' | 'complex' {
    switch (complexity) {
      case 'low': return 'simple';
      case 'medium': return 'medium';
      case 'high': return 'complex';
    }
  }
}

export const contextAwarePromptEnhancer = ContextAwarePromptEnhancer.getInstance();
