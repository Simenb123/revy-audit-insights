
import { useState, useCallback } from 'react';
import { 
  performSemanticSearch, 
  generateSearchSuggestions,
  SearchQuery,
  SearchResult,
  SearchSuggestion 
} from '@/services/documentSearch/semanticSearchService';

export const useDocumentSearch = (clientId: string) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const search = useCallback(async (query: SearchQuery): Promise<SearchResult[]> => {
    setIsSearching(true);
    try {
      const results = await performSemanticSearch(query);
      setSearchResults(results);
      
      // Add to search history
      if (query.term && !searchHistory.includes(query.term)) {
        setSearchHistory(prev => [query.term, ...prev.slice(0, 9)]); // Keep last 10 searches
      }
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [searchHistory]);

  const loadSuggestions = useCallback(async () => {
    try {
      const suggestionData = await generateSearchSuggestions(clientId);
      setSuggestions(suggestionData);
      return suggestionData;
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      return [];
    }
  }, [clientId]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    isSearching,
    searchResults,
    suggestions,
    searchHistory,
    search,
    loadSuggestions,
    clearResults,
    clearHistory
  };
};
