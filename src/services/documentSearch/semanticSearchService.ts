
import { supabase } from '@/integrations/supabase/client';

export interface SearchQuery {
  term: string;
  clientId?: string;
  filters?: {
    category?: string;
    subjectArea?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  limit?: number;
}

export interface SearchResult {
  id: string;
  fileName: string;
  category: string;
  summary: string;
  confidence: number;
  relevantText?: string;
  uploadDate: string;
}

export interface SearchSuggestion {
  query: string;
  category: string;
  confidence: number;
}

export const performSemanticSearch = async (query: SearchQuery): Promise<SearchResult[]> => {
  try {
    console.log('🔍 Performing semantic search:', query);
    
    // Call the knowledge search function
    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: { query: query.term }
    });
    
    if (error) {
      console.error('❌ Knowledge search error:', error);
      throw new Error('Search failed');
    }
    
    // Transform the results to match our SearchResult interface
    const results: SearchResult[] = (data || []).map((article: any) => ({
      id: article.id,
      fileName: article.title,
      category: article.category?.name || 'Ukategorisert',
      summary: article.summary || '',
      confidence: article.similarity || 0,
      relevantText: article.content?.substring(0, 200) + '...',
      uploadDate: article.created_at
    }));
    
    console.log('✅ Search results:', results.length);
    return results;
    
  } catch (error) {
    console.error('💥 Semantic search error:', error);
    throw error;
  }
};

export const generateSearchSuggestions = async (clientId: string): Promise<SearchSuggestion[]> => {
  // Generate some common search suggestions
  return [
    { query: 'ISA 315 risikovurdering', category: 'Revisjonsstandarder', confidence: 0.9 },
    { query: 'regnskapsloven', category: 'Lover og forskrifter', confidence: 0.8 },
    { query: 'varelager kontroll', category: 'Revisjonshandlinger', confidence: 0.7 },
    { query: 'årsoppgjør prosedyrer', category: 'Sjekklister', confidence: 0.6 }
  ];
};
