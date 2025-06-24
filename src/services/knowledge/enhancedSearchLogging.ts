import { supabase } from '@/integrations/supabase/client';

export interface SearchLogEntry {
  timestamp: string;
  userId?: string;
  query: string;
  method: 'semantic' | 'keyword' | 'hybrid';
  resultsCount: number;
  responseTime: number;
  semanticThreshold?: number;
  keywordTerms?: string[];
  topResults?: Array<{
    id: string;
    title: string;
    similarity?: number;
    relevanceScore?: number;
  }>;
  errorMessage?: string;
}

class EnhancedSearchLogger {
  private static logs: SearchLogEntry[] = [];
  private static readonly MAX_LOGS = 1000;

  static logSearch(entry: SearchLogEntry) {
    this.logs.unshift({
      ...entry,
      timestamp: new Date().toISOString()
    });

    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Console logging for development
    console.log('📊 Search Log:', {
      query: entry.query,
      method: entry.method,
      results: entry.resultsCount,
      time: `${entry.responseTime}ms`,
      error: entry.errorMessage || 'none'
    });
  }

  static getRecentLogs(limit: number = 50): SearchLogEntry[] {
    return this.logs.slice(0, limit);
  }

  static getSearchStats() {
    if (this.logs.length === 0) return null;

    const recentLogs = this.logs.slice(0, 100); // Last 100 searches
    
    const totalSearches = recentLogs.length;
    const successfulSearches = recentLogs.filter(log => !log.errorMessage).length;
    const avgResponseTime = recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / totalSearches;
    const avgResultsCount = recentLogs.reduce((sum, log) => sum + log.resultsCount, 0) / totalSearches;
    
    const methodBreakdown = recentLogs.reduce((acc, log) => {
      acc[log.method] = (acc[log.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topQueries = this.getTopQueries(recentLogs);

    return {
      totalSearches,
      successRate: (successfulSearches / totalSearches) * 100,
      avgResponseTime: Math.round(avgResponseTime),
      avgResultsCount: Math.round(avgResultsCount * 10) / 10,
      methodBreakdown,
      topQueries
    };
  }

  private static getTopQueries(logs: SearchLogEntry[]) {
    const queryFreq = logs.reduce((acc, log) => {
      const normalized = log.query.toLowerCase().trim();
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(queryFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  static clearLogs() {
    this.logs = [];
    console.log('🧹 Search logs cleared');
  }
}

export { EnhancedSearchLogger };

// Enhanced search wrapper that adds logging
export const performEnhancedSearch = async (query: string): Promise<any> => {
  const startTime = Date.now();
  let logEntry: Partial<SearchLogEntry> = {
    query,
    method: 'hybrid' // Default, will be updated based on actual execution
  };

  try {
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logEntry.userId = user.id;
    }

    console.log('🔍 Enhanced search starting for:', query);

    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: { query }
    });

    const responseTime = Date.now() - startTime;

    if (error) {
      logEntry = {
        ...logEntry,
        method: 'hybrid',
        resultsCount: 0,
        responseTime,
        errorMessage: error.message
      };
      
      EnhancedSearchLogger.logSearch(logEntry as SearchLogEntry);
      throw error;
    }

    const articles = data?.articles || [];
    const tagMapping = data?.tagMapping || {};

    // Determine search method based on results
    const hasHighSimilarity = articles.some((a: any) => a.similarity > 0.7);
    const determinedMethod = hasHighSimilarity ? 'semantic' : 'keyword';

    // Extract keyword terms (simplified)
    const keywordTerms = query.toLowerCase()
      .replace(/[^\w\såæøäöü]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 3);

    // Log top results
    const topResults = articles.slice(0, 5).map((article: any) => ({
      id: article.id,
      title: article.title,
      similarity: article.similarity,
      relevanceScore: article.relevanceScore
    }));

    logEntry = {
      ...logEntry,
      method: determinedMethod,
      resultsCount: articles.length,
      responseTime,
      semanticThreshold: 0.7,
      keywordTerms,
      topResults
    };

    EnhancedSearchLogger.logSearch(logEntry as SearchLogEntry);

    console.log('✅ Enhanced search completed:', {
      query,
      results: articles.length,
      method: determinedMethod,
      time: `${responseTime}ms`
    });

    return { articles, tagMapping };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logEntry = {
      ...logEntry,
      method: 'hybrid',
      resultsCount: 0,
      responseTime,
      errorMessage: error.message || 'Unknown error'
    };

    EnhancedSearchLogger.logSearch(logEntry as SearchLogEntry);
    
    console.error('❌ Enhanced search failed:', error);
    throw error;
  }
};
