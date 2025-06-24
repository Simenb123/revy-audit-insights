
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
    aiValidated?: boolean;
    confidenceLevel?: 'low' | 'medium' | 'high';
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
  document: {
    id: string;
    file_name: string;
    file_path: string;
    category: string;
    ai_confidence_score?: number;
    created_at: string;
  };
  relevanceScore: number;
  matchReasons: string[];
  suggestedActions?: string[];
}

export interface SearchSuggestion {
  query: string;
  category: string;
  confidence: number;
  icon?: string;
  description?: string;
  estimatedResults?: number;
}

export const performSemanticSearch = async (query: SearchQuery): Promise<SearchResult[]> => {
  try {
    console.log('🔍 Performing semantic search with enhanced multi-word support:', query);
    
    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: { query: query.term } // Fixed: ensure we use 'query' parameter name
    });
    
    if (error) {
      console.error('❌ Knowledge search error:', error);
      throw new Error('Search failed');
    }
    
    console.log('📊 Enhanced search returned:', data?.length || 0, 'results');
    
    const results: SearchResult[] = (data || []).map((article: any) => ({
      id: article.id,
      fileName: article.title,
      category: article.category?.name || 'Ukategoriseret',
      summary: article.summary || '',
      confidence: article.similarity || 0,
      relevantText: article.content?.substring(0, 200) + '...',
      uploadDate: article.created_at,
      document: {
        id: article.id,
        file_name: article.title,
        file_path: article.file_path || '',
        category: article.category?.name || 'Ukategoriseret',
        ai_confidence_score: article.similarity || 0,
        created_at: article.created_at
      },
      relevanceScore: article.similarity || 0,
      matchReasons: ['Enhanced semantic similarity', 'Multi-word keyword match'],
      suggestedActions: article.suggested_actions || []
    }));
    
    console.log('✅ Enhanced search results processed:', results.length);
    return results;
    
  } catch (error) {
    console.error('💥 Semantic search error:', error);
    throw error;
  }
};

export const generateSearchSuggestions = async (clientId: string): Promise<SearchSuggestion[]> => {
  // Generate enhanced search suggestions with multi-word examples
  return [
    { 
      query: 'ISA 315 risikovurdering', 
      category: 'Revisjonsstandarder', 
      confidence: 0.9,
      icon: '📋',
      description: 'Søk etter ISA 315 risikovurdering dokumenter med forbedret multi-ord søk',
      estimatedResults: 5
    },
    { 
      query: 'regnskapsloven årsregnskap', 
      category: 'Lover og forskrifter', 
      confidence: 0.8,
      icon: '⚖️',
      description: 'Finn dokumenter relatert til regnskapsloven og årsregnskap',
      estimatedResults: 8
    },
    { 
      query: 'varelager kontroll prosedyrer', 
      category: 'Revisjonshandlinger', 
      confidence: 0.7,
      icon: '📦',
      description: 'Søk etter varelager kontrollprosedyrer med utvidet søk',
      estimatedResults: 3
    },
    { 
      query: 'årsoppgjør prosedyrer sjekkliste', 
      category: 'Sjekklister', 
      confidence: 0.6,
      icon: '✅',
      description: 'Finn årsoppgjør prosedyrer og sjekklister med forbedret søk',
      estimatedResults: 7
    }
  ];
};

// Helper function to trigger enhanced text extraction for documents
export const triggerEnhancedTextExtraction = async (documentId: string): Promise<boolean> => {
  try {
    console.log('🔄 Triggering enhanced text extraction for document:', documentId);
    
    const { data, error } = await supabase.functions.invoke('enhanced-pdf-text-extractor', {
      body: { documentId }
    });
    
    if (error) {
      console.error('❌ Enhanced text extraction error:', error);
      return false;
    }
    
    console.log('✅ Enhanced text extraction completed:', data);
    return data?.success || false;
    
  } catch (error) {
    console.error('💥 Enhanced text extraction failed:', error);
    return false;
  }
};

// Test function to verify knowledge search is working
export const testKnowledgeSearch = async (testQuery: string = 'ISA revisjon'): Promise<boolean> => {
  try {
    console.log('🧪 Testing knowledge search with query:', testQuery);
    
    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: { query: testQuery }
    });
    
    if (error) {
      console.error('❌ Knowledge search test failed:', error);
      return false;
    }
    
    console.log('✅ Knowledge search test result:', {
      success: true,
      resultsCount: data?.length || 0,
      hasResults: Array.isArray(data) && data.length > 0
    });
    
    return true;
    
  } catch (error) {
    console.error('💥 Knowledge search test error:', error);
    return false;
  }
};
