
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
      uploadDate: article.created_at,
      document: {
        id: article.id,
        file_name: article.title,
        file_path: article.file_path || '',
        category: article.category?.name || 'Ukategorisert',
        ai_confidence_score: article.similarity || 0,
        created_at: article.created_at
      },
      relevanceScore: article.similarity || 0,
      matchReasons: ['Semantic similarity', 'Content match'],
      suggestedActions: article.suggested_actions || []
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
    { 
      query: 'ISA 315 risikovurdering', 
      category: 'Revisjonsstandarder', 
      confidence: 0.9,
      icon: '📋',
      description: 'Søk etter ISA 315 risikovurdering dokumenter',
      estimatedResults: 5
    },
    { 
      query: 'regnskapsloven', 
      category: 'Lover og forskrifter', 
      confidence: 0.8,
      icon: '⚖️',
      description: 'Finn dokumenter relatert til regnskapsloven',
      estimatedResults: 8
    },
    { 
      query: 'varelager kontroll', 
      category: 'Revisjonshandlinger', 
      confidence: 0.7,
      icon: '📦',
      description: 'Søk etter varelager kontrollprosedyrer',
      estimatedResults: 3
    },
    { 
      query: 'årsoppgjør prosedyrer', 
      category: 'Sjekklister', 
      confidence: 0.6,
      icon: '✅',
      description: 'Finn årsoppgjør prosedyrer og sjekklister',
      estimatedResults: 7
    }
  ];
};
