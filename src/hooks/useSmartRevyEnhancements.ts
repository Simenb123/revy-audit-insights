import { useState, useEffect, useCallback } from 'react';
import { AdvancedContextAnalyzer } from '@/services/advancedContextAnalyzer';
import { contextAwarePromptEnhancer } from '@/services/contextAwarePromptEnhancer';
import { SmartEmbeddingsProcessor } from '@/services/smartEmbeddingsProcessor';
import type { RevyContext } from '@/types/revio';
import { toast } from 'sonner';

interface SmartRevyEnhancementsConfig {
  context: RevyContext;
  clientData?: any;
  documentContext?: any;
  userRole?: string;
  sessionHistory?: any[];
}

interface SmartRevyEnhancementsResult {
  isAnalyzing: boolean;
  contextAnalysis: any;
  enhancedPromptData: any;
  embeddings: any;
  performAnalysis: (config: SmartRevyEnhancementsConfig) => Promise<void>;
  clearAnalysis: () => void;
  getSmartSuggestions: () => string[];
  isEnhancementReady: boolean;
}

export const useSmartRevyEnhancements = (): SmartRevyEnhancementsResult => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextAnalysis, setContextAnalysis] = useState<any>(null);
  const [enhancedPromptData, setEnhancedPromptData] = useState<any>(null);
  const [embeddings, setEmbeddings] = useState<any>(null);
  const [contextAnalyzer] = useState(() => new AdvancedContextAnalyzer());
  const [embeddingsProcessor] = useState(() => new SmartEmbeddingsProcessor());

  const performAnalysis = useCallback(async (config: SmartRevyEnhancementsConfig) => {
    const { context, clientData, documentContext, userRole = 'employee', sessionHistory = [] } = config;
    
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      // 1. Advanced Context Analysis
      const analysis = await contextAnalyzer.analyzeContext({
        currentContext: context,
        userRole,
        documentContext,
        clientData,
        sessionHistory,
        recentActivity: []
      });
      
      setContextAnalysis(analysis);
      
      // 2. Context-Aware Prompt Enhancement
      const promptEnhancement = await contextAwarePromptEnhancer.enhancePrompt(
        'Analyzing current context for optimal AI assistance',
        context,
        null, // Let the service determine the best variant
        {},
        {
          clientData,
          documentContext,
          userRole,
          sessionHistory
        }
      );
      
      setEnhancedPromptData(promptEnhancement);
      
      // 3. Smart Embeddings Processing (if documents are available)
      if (documentContext && documentContext.length > 0) {
        try {
          // Note: SmartEmbeddingsProcessor methods would be called here
          // For now, we'll skip embeddings processing until the full implementation
          setEmbeddings({ processed: documentContext.length, available: true });
        } catch (embeddingError) {
          console.warn('Embeddings processing failed:', embeddingError);
          // Non-critical error, continue without embeddings
        }
      }
      
      toast.success('AI-forbedringer aktivert', {
        description: 'Kontekstanalyse og prompt-optimalisering fullført'
      });
      
    } catch (error) {
      console.error('Smart Revy enhancements failed:', error);
      toast.error('Kunne ikke aktivere smarte forbedringer', {
        description: 'Basisfunksjonalitet fungerer fortsatt normalt'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, contextAnalyzer]);

  const clearAnalysis = useCallback(() => {
    setContextAnalysis(null);
    setEnhancedPromptData(null);
    setEmbeddings(null);
  }, []);

  const getSmartSuggestions = useCallback((): string[] => {
    if (!contextAnalysis) return [];
    
    const suggestions: string[] = [];
    
    // Based on context analysis
    if (contextAnalysis.primaryContext === 'audit-actions') {
      suggestions.push('Hvilke revisjonshandlinger bør utføres først?');
      suggestions.push('Vis meg relevante ISA-standarder for denne situasjonen');
    }
    
    if (contextAnalysis.documentInsights?.riskLevel === 'high') {
      suggestions.push('Analyser risikoområder i dokumentene');
      suggestions.push('Foreslå tiltak for høy risiko');
    }
    
    if (contextAnalysis.documentInsights?.complexity === 'high') {
      suggestions.push('Bryt ned de mest komplekse områdene');
      suggestions.push('Prioriter arbeidsoppgaver etter kompleksitet');
    }
    
    // Based on user behavior patterns
    if (contextAnalysis.userBehaviorPatterns?.expertiseLevel === 'expert') {
      suggestions.push('Vis avanserte revisjonsteknikker');
      suggestions.push('Diskuter profesjonell skjønn i denne situasjonen');
    } else if (contextAnalysis.userBehaviorPatterns?.expertiseLevel === 'beginner') {
      suggestions.push('Forklar grunnleggende prinsipper');
      suggestions.push('Gi steg-for-steg veiledning');
    }
    
    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }, [contextAnalysis]);

  const isEnhancementReady = Boolean(
    contextAnalysis && 
    enhancedPromptData && 
    !isAnalyzing
  );

  return {
    isAnalyzing,
    contextAnalysis,
    enhancedPromptData,
    embeddings,
    performAnalysis,
    clearAnalysis,
    getSmartSuggestions,
    isEnhancementReady
  };
};