import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { 
  LegalDocument, 
  LegalProvision, 
  LegalSearchContext, 
  LegalSearchResult,
  LegalAIContext,
  ProvisionDocumentRelation,
  DocumentCrossReference,
  LegalCitation
} from '@/types/legal-knowledge';

export class LegalKnowledgeService {
  
  /**
   * Enhanced legal search with structured and semantic capabilities
   */
  static async searchLegalKnowledge(context: LegalSearchContext): Promise<LegalSearchResult> {
    const startTime = Date.now();
    
    try {
      // 1. Search legal documents
      const documentsQuery = supabase
        .from('legal_documents')
        .select(`
          *,
          document_type:legal_document_types(*)
        `)
        .eq('document_status', 'active');

      // Apply filters
      if (context.document_types?.length) {
        documentsQuery.in('document_type_id', context.document_types);
      }
      
      if (context.date_filters?.from) {
        documentsQuery.gte('publication_date', context.date_filters.from);
      }
      
      if (context.date_filters?.to) {
        documentsQuery.lte('publication_date', context.date_filters.to);
      }

      // Text search
      if (context.query) {
        documentsQuery.ilike('content', `%${context.query}%`);
      }

      const { data: documents, error: docError } = await documentsQuery;
      
      if (docError) throw docError;

      // 2. Search legal provisions
      const provisionsQuery = supabase
        .from('legal_provisions')
        .select('*')
        .eq('is_active', true);

      if (context.hierarchy_filters?.law_identifier) {
        provisionsQuery.eq('law_identifier', context.hierarchy_filters.law_identifier);
      }

      if (context.hierarchy_filters?.provision_type) {
        provisionsQuery.eq('provision_type', context.hierarchy_filters.provision_type);
      }

      if (context.query) {
        provisionsQuery.or(`title.ilike.%${context.query}%,content.ilike.%${context.query}%`);
      }

      const { data: provisions, error: provError } = await provisionsQuery;
      
      if (provError) throw provError;

      // 3. Search citations
      const { data: citations, error: citError } = await supabase
        .from('legal_citations')
        .select(`
          *,
          document:legal_documents(*),
          provision:legal_provisions(*)
        `)
        .ilike('citation_text', `%${context.query}%`);

      if (citError) throw citError;

      // 4. Calculate authority ranking
      const authority_ranking = documents?.map(doc => {
        const authorityScore = doc.document_type?.authority_weight || 0;
        const relevanceScore = this.calculateRelevanceScore(doc, context.query);
        const combinedScore = (authorityScore * 0.6) + (relevanceScore * 0.4);
        
        return {
          document_id: doc.id,
          authority_score: authorityScore,
          relevance_score: relevanceScore,
          combined_score: combinedScore
        };
      }).sort((a, b) => b.combined_score - a.combined_score) || [];

      const searchTime = Date.now() - startTime;

      return {
        documents: documents || [],
        provisions: provisions || [],
        citations: citations || [],
        authority_ranking,
        search_metadata: {
          total_results: (documents?.length || 0) + (provisions?.length || 0),
          search_time_ms: searchTime,
          query_type: 'hybrid'
        }
      };

    } catch (error) {
      logger.error('Error in legal knowledge search:', error);
      throw error;
    }
  }

  /**
   * Get AI-optimized context for a specific legal query
   */
  static async getLegalAIContext(query: string, provision_id?: string): Promise<LegalAIContext> {
    try {
      // Get search results
      const searchResults = await this.searchLegalKnowledge({ query });
      
      // Categorize sources by authority level
      const primary_sources = searchResults.documents.filter(doc => 
        doc.document_type?.hierarchy_level === 1
      );
      
      const secondary_sources = searchResults.documents.filter(doc => 
        doc.document_type?.hierarchy_level === 2
      );
      
      const tertiary_sources = searchResults.documents.filter(doc => 
        doc.document_type?.hierarchy_level === 3
      );

      // Get cross-references if provision_id is provided
      let cross_references: DocumentCrossReference[] = [];
      if (provision_id) {
        const { data, error } = await supabase
          .from('document_cross_references')
          .select(`
            *,
            source_document:legal_documents!source_document_id(*),
            target_document:legal_documents!target_document_id(*)
          `)
          .or(`source_document_id.in.(${searchResults.documents.map(d => d.id).join(',')}),target_document_id.in.(${searchResults.documents.map(d => d.id).join(',')})`);
        
        if (!error) cross_references = data || [];
      }

      // Create source hierarchy ordered by authority
      const source_hierarchy = searchResults.authority_ranking
        .slice(0, 10) // Top 10 most authoritative sources
        .map(rank => rank.document_id);

      // Generate context summary
      const legal_context_summary = this.generateContextSummary(
        primary_sources,
        secondary_sources,
        searchResults.provisions
      );

      return {
        primary_sources,
        secondary_sources,
        tertiary_sources,
        relevant_provisions: searchResults.provisions,
        cross_references,
        source_hierarchy,
        legal_context_summary
      };

    } catch (error) {
      logger.error('Error getting legal AI context:', error);
      throw error;
    }
  }

  /**
   * Import legal document with automatic provision and citation extraction
   */
  static async importLegalDocument(
    title: string,
    content: string,
    document_type_id: string,
    metadata: {
      document_number?: string;
      publication_date?: string;
      issuing_authority?: string;
      source_url?: string;
    }
  ): Promise<string> {
    try {
      // Insert main document
      const { data: document, error: docError } = await supabase
        .from('legal_documents')
        .insert({
          title,
          content,
          document_type_id,
          document_number: metadata.document_number,
          publication_date: metadata.publication_date,
          issuing_authority: metadata.issuing_authority,
          source_url: metadata.source_url,
          is_primary_source: false // Will be determined by document type
        })
        .select()
        .single();

      if (docError) throw docError;

      // Extract and save citations
      const citations = this.extractLegalCitations(content);
      if (citations.length > 0) {
        const citationInserts = citations.map(citation => ({
          document_id: document.id,
          citation_text: citation.citation_text,
          citation_context: citation.citation_context,
          position_start: citation.position_start,
          position_end: citation.position_end,
          is_verified: false
        }));

        await supabase
          .from('legal_citations')
          .insert(citationInserts);
      }

      logger.log(`Imported legal document: ${title} with ${citations.length} citations`);
      return document.id;

    } catch (error) {
      logger.error('Error importing legal document:', error);
      throw error;
    }
  }

  /**
   * Create provision-document relationship
   */
  static async createProvisionDocumentRelation(
    provision_id: string,
    document_id: string,
    relation_type: 'explains' | 'interprets' | 'cites' | 'supersedes' | 'implements',
    relevance_score: number = 1.0,
    context_description?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('provision_document_relations')
        .insert({
          provision_id,
          document_id,
          relation_type,
          relevance_score,
          context_description
        });

      if (error) throw error;

    } catch (error) {
      logger.error('Error creating provision-document relation:', error);
      throw error;
    }
  }

  /**
   * Get documents related to a specific provision
   */
  static async getProvisionDocuments(provision_id: string): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase
        .from('provision_document_relations')
        .select(`
          relevance_score,
          relation_type,
          document:legal_documents(
            *,
            document_type:legal_document_types(*)
          )
        `)
        .eq('provision_id', provision_id)
        .order('relevance_score', { ascending: false });

      if (error) throw error;

      return data?.map(rel => rel.document).filter(Boolean) || [];

    } catch (error) {
      logger.error('Error getting provision documents:', error);
      throw error;
    }
  }

  // Private helper methods
  private static calculateRelevanceScore(document: LegalDocument, query: string): number {
    if (!query) return 0.5;
    
    const titleMatch = document.title.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
    const contentMatch = document.content?.toLowerCase().includes(query.toLowerCase()) ? 0.2 : 0;
    const summaryMatch = document.summary?.toLowerCase().includes(query.toLowerCase()) ? 0.1 : 0;
    
    return Math.min(1.0, titleMatch + contentMatch + summaryMatch + 0.4); // Base score of 0.4
  }

  private static generateContextSummary(
    primary_sources: LegalDocument[],
    secondary_sources: LegalDocument[],
    provisions: LegalProvision[]
  ): string {
    const parts = [];
    
    if (primary_sources.length > 0) {
      parts.push(`Primærkilder: ${primary_sources.length} lover/forskrifter`);
    }
    
    if (secondary_sources.length > 0) {
      parts.push(`Sekundærkilder: ${secondary_sources.length} dommer/forarbeider`);
    }
    
    if (provisions.length > 0) {
      parts.push(`Relevante bestemmelser: ${provisions.length} paragrafer`);
    }
    
    return parts.join('. ') || 'Ingen relevante kilder funnet.';
  }

  private static extractLegalCitations(content: string): LegalCitation[] {
    const citations: LegalCitation[] = [];
    
    // Norwegian legal reference patterns
    const patterns = [
      /(\w+loven)\s*§\s*(\d+(?:-\d+)*)/gi,  // regnskapsloven § 3-1
      /§\s*(\d+(?:-\d+)*)/gi,               // § 3-1
      /artikkel\s*(\d+)/gi,                 // artikkel 8
      /lov\s+(\d{4}-\d{2}-\d{2}-\d+)/gi     // lov 1998-07-17-56
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const citation_text = match[0];
        const position_start = match.index;
        const position_end = match.index + citation_text.length;
        
        // Get surrounding context (50 chars before and after)
        const contextStart = Math.max(0, position_start - 50);
        const contextEnd = Math.min(content.length, position_end + 50);
        const citation_context = content.substring(contextStart, contextEnd);

        citations.push({
          id: '', // Will be generated by database
          document_id: '', // Will be set by caller
          citation_text,
          citation_context,
          position_start,
          position_end,
          is_verified: false,
          created_at: new Date().toISOString()
        });
      }
    });

    return citations;
  }
}