import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface EnhancedSearchQuery {
  term: string;
  clientId: string;
  categories?: string[];
  confidenceThreshold?: number;
  semanticSimilarityThreshold?: number;
  includeAuditImplications?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface EnhancedSearchResult {
  documentId: string;
  fileName: string;
  category: string;
  confidence: number;
  semanticSimilarity: number;
  relevanceScore: number;
  matchType: 'exact' | 'semantic' | 'category' | 'content';
  excerpts: string[];
  auditImplications: string[];
  keywords: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface SemanticInsight {
  type: 'pattern' | 'anomaly' | 'relationship' | 'trend';
  title: string;
  description: string;
  confidence: number;
  relatedDocuments: string[];
  actionable: boolean;
  severity: 'low' | 'medium' | 'high';
}

export class EnhancedSemanticSearchService {
  private static instance: EnhancedSemanticSearchService;
  
  public static getInstance(): EnhancedSemanticSearchService {
    if (!EnhancedSemanticSearchService.instance) {
      EnhancedSemanticSearchService.instance = new EnhancedSemanticSearchService();
    }
    return EnhancedSemanticSearchService.instance;
  }

  /**
   * Perform enhanced semantic search with AI-powered relevance ranking
   */
  async performEnhancedSearch(query: EnhancedSearchQuery): Promise<EnhancedSearchResult[]> {
    try {
      logger.info('Performing enhanced semantic search', { query });

      // Call the enhanced semantic search edge function
      const { data, error } = await supabase.functions.invoke('enhanced-semantic-search', {
        body: {
          query: query.term,
          clientId: query.clientId,
          filters: {
            categories: query.categories,
            confidenceThreshold: query.confidenceThreshold || 0.5,
            semanticSimilarityThreshold: query.semanticSimilarityThreshold || 0.7,
            includeAuditImplications: query.includeAuditImplications || true,
            dateRange: query.dateRange
          }
        }
      });

      if (error) {
        logger.error('Enhanced semantic search failed', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      const results = data?.results || [];
      
      // Sort by relevance score (combination of semantic similarity and confidence)
      return results.sort((a: EnhancedSearchResult, b: EnhancedSearchResult) => 
        b.relevanceScore - a.relevanceScore
      );

    } catch (error) {
      logger.error('Enhanced semantic search error', error);
      throw error;
    }
  }

  /**
   * Generate semantic insights from document corpus
   */
  async generateSemanticInsights(clientId: string): Promise<SemanticInsight[]> {
    try {
      logger.info('Generating semantic insights', { clientId });

      const { data, error } = await supabase.functions.invoke('enhanced-semantic-search', {
        body: {
          action: 'generate_insights',
          clientId,
          analysisTypes: ['patterns', 'anomalies', 'relationships', 'trends']
        }
      });

      if (error) {
        logger.error('Semantic insights generation failed', error);
        throw new Error(`Insights generation failed: ${error.message}`);
      }

      return data?.insights || [];

    } catch (error) {
      logger.error('Semantic insights error', error);
      throw error;
    }
  }

  /**
   * Find similar documents using vector embeddings
   */
  async findSimilarDocuments(
    documentId: string, 
    clientId: string, 
    limit: number = 5
  ): Promise<EnhancedSearchResult[]> {
    try {
      logger.info('Finding similar documents', { documentId, clientId, limit });

      const { data, error } = await supabase.functions.invoke('enhanced-semantic-search', {
        body: {
          action: 'find_similar',
          documentId,
          clientId,
          limit
        }
      });

      if (error) {
        logger.error('Similar documents search failed', error);
        throw new Error(`Similar documents search failed: ${error.message}`);
      }

      return data?.similarDocuments || [];

    } catch (error) {
      logger.error('Similar documents search error', error);
      throw error;
    }
  }

  /**
   * Analyze document relationships and create knowledge graph
   */
  async analyzeDocumentRelationships(clientId: string): Promise<{
    nodes: Array<{ id: string; label: string; type: string; weight: number }>;
    edges: Array<{ source: string; target: string; weight: number; type: string }>;
  }> {
    try {
      logger.info('Analyzing document relationships', { clientId });

      const { data, error } = await supabase.functions.invoke('enhanced-semantic-search', {
        body: {
          action: 'analyze_relationships',
          clientId
        }
      });

      if (error) {
        logger.error('Document relationship analysis failed', error);
        throw new Error(`Relationship analysis failed: ${error.message}`);
      }

      return data?.relationshipGraph || { nodes: [], edges: [] };

    } catch (error) {
      logger.error('Document relationship analysis error', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered search suggestions based on document corpus
   */
  async generateAdvancedSearchSuggestions(clientId: string): Promise<Array<{
    query: string;
    description: string;
    expectedResults: number;
    auditRelevance: 'high' | 'medium' | 'low';
    category: string;
  }>> {
    try {
      logger.info('Generating advanced search suggestions', { clientId });

      const { data, error } = await supabase.functions.invoke('enhanced-semantic-search', {
        body: {
          action: 'generate_suggestions',
          clientId
        }
      });

      if (error) {
        logger.error('Advanced search suggestions generation failed', error);
        throw new Error(`Suggestions generation failed: ${error.message}`);
      }

      return data?.suggestions || [];

    } catch (error) {
      logger.error('Advanced search suggestions error', error);
      throw error;
    }
  }

  /**
   * Perform cross-client semantic analysis for pattern detection
   */
  async performCrossClientAnalysis(
    baseClientId: string,
    compareClientIds: string[],
    analysisType: 'patterns' | 'anomalies' | 'benchmarking'
  ): Promise<{
    insights: SemanticInsight[];
    comparisons: Array<{
      clientId: string;
      similarity: number;
      distinctPatterns: string[];
      commonPatterns: string[];
    }>;
  }> {
    try {
      logger.info('Performing cross-client semantic analysis', { 
        baseClientId, 
        compareClientIds, 
        analysisType 
      });

      const { data, error } = await supabase.functions.invoke('enhanced-semantic-search', {
        body: {
          action: 'cross_client_analysis',
          baseClientId,
          compareClientIds,
          analysisType
        }
      });

      if (error) {
        logger.error('Cross-client analysis failed', error);
        throw new Error(`Cross-client analysis failed: ${error.message}`);
      }

      return data?.analysis || { insights: [], comparisons: [] };

    } catch (error) {
      logger.error('Cross-client analysis error', error);
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedSemanticSearchService = EnhancedSemanticSearchService.getInstance();

// Export convenience functions
export const performEnhancedSearch = (query: EnhancedSearchQuery) => 
  enhancedSemanticSearchService.performEnhancedSearch(query);

export const generateSemanticInsights = (clientId: string) => 
  enhancedSemanticSearchService.generateSemanticInsights(clientId);

export const findSimilarDocuments = (documentId: string, clientId: string, limit?: number) => 
  enhancedSemanticSearchService.findSimilarDocuments(documentId, clientId, limit);

export const analyzeDocumentRelationships = (clientId: string) => 
  enhancedSemanticSearchService.analyzeDocumentRelationships(clientId);

export const generateAdvancedSearchSuggestions = (clientId: string) => 
  enhancedSemanticSearchService.generateAdvancedSearchSuggestions(clientId);

export const performCrossClientAnalysis = (
  baseClientId: string,
  compareClientIds: string[],
  analysisType: 'patterns' | 'anomalies' | 'benchmarking'
) => enhancedSemanticSearchService.performCrossClientAnalysis(baseClientId, compareClientIds, analysisType);