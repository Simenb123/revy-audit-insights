import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { getRelevantISAStandards } from './isaSemanticService';
import type { RevyContext } from '@/types/revio';
import type { AIRevyVariant } from '@/hooks/useAIRevyVariants';

export interface AdvancedContextAnalysis {
  primaryContext: RevyContext;
  contextConfidence: number;
  documentInsights: {
    types: string[];
    complexity: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
    auditPhase: string;
    isaRelevance: string[];
  };
  userBehaviorPatterns: {
    frequentContexts: string[];
    expertiseLevel: 'junior' | 'senior' | 'expert';
    preferredInteractionStyle: 'detailed' | 'concise' | 'guided';
  };
  clientInsights: {
    industry: string;
    size: 'small' | 'medium' | 'large';
    riskProfile: 'low' | 'medium' | 'high';
    auditHistoryComplexity: number;
  };
  recommendedActions: string[];
  contextSwitchingRules: ContextSwitchingRule[];
}

export interface ContextSwitchingRule {
  condition: string;
  targetContext: RevyContext;
  confidence: number;
  reasoning: string;
}

export interface ContextAnalysisInput {
  currentContext: RevyContext;
  clientData?: any;
  documentContext?: any;
  userRole?: string;
  recentActivity?: any[];
  sessionHistory?: any[];
}

export class AdvancedContextAnalyzer {
  private static instance: AdvancedContextAnalyzer;
  private contextHistory: Map<string, RevyContext[]> = new Map();
  private userPatterns: Map<string, any> = new Map();

  static getInstance(): AdvancedContextAnalyzer {
    if (!AdvancedContextAnalyzer.instance) {
      AdvancedContextAnalyzer.instance = new AdvancedContextAnalyzer();
    }
    return AdvancedContextAnalyzer.instance;
  }

  async analyzeContext(input: ContextAnalysisInput): Promise<AdvancedContextAnalysis> {
    try {
      const startTime = performance.now();
      
      // Parallel analysis of different context dimensions
      const [documentInsights, userPatterns, clientInsights, isaRelevance] = await Promise.all([
        this.analyzeDocumentContext(input.documentContext),
        this.analyzeUserBehavior(input.recentActivity, input.sessionHistory),
        this.analyzeClientContext(input.clientData),
        this.getISAContextRelevance(input.currentContext, input.documentContext)
      ]);

      // Calculate context confidence based on multiple factors
      const contextConfidence = this.calculateContextConfidence(input, documentInsights, userPatterns);

      // Generate context switching rules
      const contextSwitchingRules = this.generateContextSwitchingRules(
        input.currentContext,
        documentInsights,
        userPatterns,
        clientInsights
      );

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(
        input.currentContext,
        documentInsights,
        clientInsights,
        userPatterns
      );

      const analysis: AdvancedContextAnalysis = {
        primaryContext: input.currentContext,
        contextConfidence,
        documentInsights: {
          ...documentInsights,
          isaRelevance
        },
        userBehaviorPatterns: userPatterns,
        clientInsights,
        recommendedActions,
        contextSwitchingRules
      };

      const executionTime = performance.now() - startTime;
      logger.info('Advanced context analysis completed', {
        context: input.currentContext,
        confidence: contextConfidence,
        executionTimeMs: Math.round(executionTime)
      });

      return analysis;

    } catch (error) {
      logger.error('Error in advanced context analysis:', error);
      return this.getDefaultAnalysis(input.currentContext);
    }
  }

  private async analyzeDocumentContext(documentContext?: any) {
    if (!documentContext) {
      return {
        types: [],
        complexity: 'low' as const,
        riskLevel: 'low' as const,
        auditPhase: 'unknown'
      };
    }

    const types = this.extractDocumentTypes(documentContext);
    const complexity = this.assessComplexity(documentContext, types);
    const riskLevel = this.assessRiskLevel(documentContext, types);
    const auditPhase = this.detectAuditPhase(documentContext, types);

    return {
      types,
      complexity,
      riskLevel,
      auditPhase
    };
  }

  private async analyzeUserBehavior(recentActivity?: any[], sessionHistory?: any[]) {
    const defaultPattern = {
      frequentContexts: ['general'],
      expertiseLevel: 'junior' as const,
      preferredInteractionStyle: 'guided' as const
    };

    if (!recentActivity || !sessionHistory) {
      return defaultPattern;
    }

    // Analyze context usage patterns
    const contextFrequency = this.analyzeContextFrequency(sessionHistory);
    const expertiseLevel = this.assessExpertiseLevel(recentActivity, sessionHistory);
    const interactionStyle = this.detectInteractionStyle(sessionHistory);

    return {
      frequentContexts: Object.keys(contextFrequency).slice(0, 3),
      expertiseLevel,
      preferredInteractionStyle: interactionStyle
    };
  }

  private async analyzeClientContext(clientData?: any) {
    const defaultInsights = {
      industry: 'unknown',
      size: 'medium' as const,
      riskProfile: 'medium' as const,
      auditHistoryComplexity: 0.5
    };

    if (!clientData) {
      return defaultInsights;
    }

    const industry = clientData.industry || 'unknown';
    const size = this.assessClientSize(clientData);
    const riskProfile = this.assessClientRisk(clientData, industry);
    const auditHistoryComplexity = await this.calculateAuditComplexity(clientData.id);

    return {
      industry,
      size,
      riskProfile,
      auditHistoryComplexity
    };
  }

  private async getISAContextRelevance(context: RevyContext, documentContext?: any): Promise<string[]> {
    try {
      const semanticContext = {
        context: context,
        documentTypes: documentContext?.types || [],
        riskLevel: documentContext?.riskLevel || 'medium',
        auditPhase: documentContext?.auditPhase || 'execution',
        clientIndustry: documentContext?.industry || 'general'
      };
      
      const isaStandards = await getRelevantISAStandards(semanticContext);
      return isaStandards.map(mapping => mapping.isa_number).slice(0, 5); // Top 5 most relevant
    } catch (error) {
      logger.error('Error getting ISA context relevance:', error);
      return [];
    }
  }

  private extractDocumentTypes(documentContext: any): string[] {
    const types: string[] = [];
    
    if (documentContext.filename) {
      const filename = documentContext.filename.toLowerCase();
      if (filename.includes('hovedbok') || filename.includes('ledger')) types.push('hovedbok');
      if (filename.includes('balanse') || filename.includes('balance')) types.push('balanse');
      if (filename.includes('resultat') || filename.includes('income')) types.push('resultat');
      if (filename.includes('noter') || filename.includes('notes')) types.push('noter');
      if (filename.includes('kontantstrøm') || filename.includes('cash')) types.push('kontantstrøm');
    }

    if (documentContext.content) {
      const content = documentContext.content.toLowerCase();
      if (content.includes('regnskap')) types.push('regnskap');
      if (content.includes('revisjon')) types.push('revisjon');
      if (content.includes('kontroll')) types.push('kontroll');
    }

    return [...new Set(types)];
  }

  private assessComplexity(documentContext: any, types: string[]): 'low' | 'medium' | 'high' {
    let complexity = 0;
    
    // More document types = higher complexity
    complexity += types.length * 0.2;
    
    // Specific high-complexity indicators
    if (types.includes('noter') || types.includes('kontantstrøm')) complexity += 0.3;
    if (documentContext.content && documentContext.content.length > 10000) complexity += 0.2;
    
    if (complexity > 0.7) return 'high';
    if (complexity > 0.4) return 'medium';
    return 'low';
  }

  private assessRiskLevel(documentContext: any, types: string[]): 'low' | 'medium' | 'high' {
    let risk = 0;
    
    // Financial statement documents = higher risk
    const highRiskTypes = ['balanse', 'resultat', 'kontantstrøm', 'noter'];
    const highRiskCount = types.filter(type => highRiskTypes.includes(type)).length;
    risk += highRiskCount * 0.25;
    
    // Content-based risk indicators
    if (documentContext.content) {
      const riskIndicators = ['vesentlig', 'risiko', 'feil', 'avvik', 'usikkerhet'];
      const riskMatches = riskIndicators.filter(indicator => 
        documentContext.content.toLowerCase().includes(indicator)
      ).length;
      risk += riskMatches * 0.1;
    }
    
    if (risk > 0.7) return 'high';
    if (risk > 0.4) return 'medium';
    return 'low';
  }

  private detectAuditPhase(documentContext: any, types: string[]): string {
    if (!documentContext.content) return 'unknown';
    
    const content = documentContext.content.toLowerCase();
    
    if (content.includes('planlegg') || content.includes('forbered')) return 'planning';
    if (content.includes('utfør') || content.includes('test') || content.includes('kontroll')) return 'execution';
    if (content.includes('konklusjon') || content.includes('rapport') || content.includes('avslut')) return 'completion';
    
    // Infer from document types
    if (types.includes('balanse') || types.includes('resultat')) return 'execution';
    if (types.includes('noter')) return 'completion';
    
    return 'execution'; // Default assumption
  }

  private analyzeContextFrequency(sessionHistory: any[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    sessionHistory.forEach(session => {
      if (session.context) {
        frequency[session.context] = (frequency[session.context] || 0) + 1;
      }
    });
    
    return frequency;
  }

  private assessExpertiseLevel(recentActivity: any[], sessionHistory: any[]): 'junior' | 'senior' | 'expert' {
    let expertiseScore = 0;
    
    // Look for advanced features usage
    const advancedFeatures = ['risk-assessment', 'documentation', 'audit-actions'];
    const advancedUsage = recentActivity.filter(activity => 
      advancedFeatures.includes(activity.context)
    ).length;
    
    expertiseScore += advancedUsage * 0.1;
    
    // Session complexity and frequency
    const avgSessionLength = sessionHistory.reduce((sum, session) => 
      sum + (session.duration || 0), 0) / sessionHistory.length;
    
    if (avgSessionLength > 30) expertiseScore += 0.3; // Long sessions indicate expertise
    
    if (expertiseScore > 0.7) return 'expert';
    if (expertiseScore > 0.4) return 'senior';
    return 'junior';
  }

  private detectInteractionStyle(sessionHistory: any[]): 'detailed' | 'concise' | 'guided' {
    if (sessionHistory.length === 0) return 'guided';
    
    // Analyze message patterns
    const avgMessageLength = sessionHistory.reduce((sum, session) => 
      sum + (session.avgMessageLength || 50), 0) / sessionHistory.length;
    
    const hasComplexQueries = sessionHistory.some(session => 
      session.complexQueries && session.complexQueries > 2
    );
    
    if (avgMessageLength > 100 && hasComplexQueries) return 'detailed';
    if (avgMessageLength < 50) return 'concise';
    return 'guided';
  }

  private assessClientSize(clientData: any): 'small' | 'medium' | 'large' {
    if (clientData.revenue) {
      if (clientData.revenue > 100000000) return 'large'; // 100M NOK
      if (clientData.revenue > 10000000) return 'medium'; // 10M NOK
      return 'small';
    }
    
    if (clientData.employees) {
      if (clientData.employees > 100) return 'large';
      if (clientData.employees > 20) return 'medium';
      return 'small';
    }
    
    return 'medium'; // Default
  }

  private assessClientRisk(clientData: any, industry: string): 'low' | 'medium' | 'high' {
    let risk = 0.5; // Base risk
    
    // Industry-based risk adjustments
    const highRiskIndustries = ['finance', 'construction', 'oil', 'technology'];
    if (highRiskIndustries.includes(industry.toLowerCase())) {
      risk += 0.2;
    }
    
    // Client-specific risk factors
    if (clientData.auditIssues && clientData.auditIssues.length > 0) {
      risk += 0.3;
    }
    
    if (risk > 0.7) return 'high';
    if (risk > 0.4) return 'medium';
    return 'low';
  }

  private async calculateAuditComplexity(clientId?: string): Promise<number> {
    if (!clientId) return 0.5;
    
    try {
      // This would query historical audit data to assess complexity
      // For now, return a default value
      return 0.5;
    } catch (error) {
      return 0.5;
    }
  }

  private calculateContextConfidence(
    input: ContextAnalysisInput,
    documentInsights: any,
    userPatterns: any
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Document context boosts confidence
    if (documentInsights.types.length > 0) {
      confidence += 0.2;
    }
    
    // User pattern consistency
    if (userPatterns.frequentContexts.includes(input.currentContext)) {
      confidence += 0.2;
    }
    
    // Client data availability
    if (input.clientData) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, confidence);
  }

  private generateContextSwitchingRules(
    currentContext: RevyContext,
    documentInsights: any,
    userPatterns: any,
    clientInsights: any
  ): ContextSwitchingRule[] {
    const rules: ContextSwitchingRule[] = [];
    
    // High-risk documents should suggest risk-assessment context
    if (documentInsights.riskLevel === 'high' && currentContext !== 'risk-assessment') {
      rules.push({
        condition: 'Høyrisiko dokumenter oppdaget',
        targetContext: 'risk-assessment',
        confidence: 0.8,
        reasoning: 'Dokumentene indikerer høy risiko som krever risikovurdering'
      });
    }
    
    // Complex documents in general context should suggest audit-actions
    if (documentInsights.complexity === 'high' && currentContext === 'general') {
      rules.push({
        condition: 'Komplekse dokumenter i generell kontekst',
        targetContext: 'audit-actions',
        confidence: 0.7,
        reasoning: 'Komplekse dokumenter krever strukturerte revisjonshandlinger'
      });
    }
    
    // Expert users with detailed preference in basic contexts
    if (userPatterns.expertiseLevel === 'expert' && 
        userPatterns.preferredInteractionStyle === 'detailed' &&
        ['general', 'dashboard'].includes(currentContext)) {
      rules.push({
        condition: 'Ekspert bruker i grunnleggende kontekst',
        targetContext: 'audit-actions',
        confidence: 0.6,
        reasoning: 'Erfarne brukere kan dra nytte av avanserte funksjoner'
      });
    }
    
    return rules;
  }

  private generateRecommendedActions(
    currentContext: RevyContext,
    documentInsights: any,
    clientInsights: any,
    userPatterns: any
  ): string[] {
    const actions: string[] = [];
    
    // Context-specific recommendations
    switch (currentContext) {
      case 'client-detail':
        if (documentInsights.riskLevel === 'high') {
          actions.push('Vurder å utføre utvidet risikoanalyse');
        }
        if (clientInsights.size === 'large') {
          actions.push('Vurder segmentert tilnærming for store klienter');
        }
        break;
        
      case 'audit-actions':
        if (documentInsights.auditPhase === 'planning') {
          actions.push('Fokuser på planleggingsprosedyrer og risikovurdering');
        }
        if (documentInsights.isaRelevance.length > 0) {
          actions.push(`Referer til relevante ISA-standarder: ${documentInsights.isaRelevance.slice(0, 2).join(', ')}`);
        }
        break;
        
      case 'documentation':
        if (userPatterns.expertiseLevel === 'junior') {
          actions.push('Bruk dokumentasjonsmal for å sikre fullstendighet');
        }
        actions.push('Kvalitetssikre dokumentasjon før ferdigstillelse');
        break;
    }
    
    // General recommendations based on insights
    if (documentInsights.complexity === 'high') {
      actions.push('Vurder å involvere senior personell');
    }
    
    if (clientInsights.riskProfile === 'high') {
      actions.push('Øk detaljnivået i revisjonsprosedyrer');
    }
    
    return actions;
  }

  private buildContextPrompt(context: RevyContext, documentContext?: any): string {
    let prompt = `Revisjonskontekst: ${context}`;
    
    if (documentContext) {
      if (documentContext.filename) {
        prompt += ` - Dokument: ${documentContext.filename}`;
      }
      if (documentContext.content) {
        const preview = documentContext.content.substring(0, 200);
        prompt += ` - Innhold: ${preview}...`;
      }
    }
    
    return prompt;
  }

  private getDefaultAnalysis(context: RevyContext): AdvancedContextAnalysis {
    return {
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
      recommendedActions: ['Fortsett med gjeldende arbeidsflyt'],
      contextSwitchingRules: []
    };
  }
}

export const advancedContextAnalyzer = AdvancedContextAnalyzer.getInstance();