import { supabase } from '@/integrations/supabase/client';

export interface SearchDiagnostic {
  timestamp: string;
  query: string;
  semanticResults: number;
  keywordResults: number;
  totalResults: number;
  responseTime: number;
  errors: string[];
  warnings: string[];
}

export interface KnowledgeBaseHealth {
  totalArticles: number;
  publishedArticles: number;
  articlesWithEmbeddings: number;
  embeddingCoverage: number;
  searchFunctionStatus: 'working' | 'error' | 'unknown';
  lastChecked: string;
}

export class KnowledgeSearchDiagnostics {
  private static diagnosticHistory: SearchDiagnostic[] = [];

  static async runHealthCheck(): Promise<KnowledgeBaseHealth> {
    console.log('🏥 Running knowledge base health check...');
    const startTime = Date.now();

    try {
      // Check article counts
      const { count: totalCount } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true });

      const { count: publishedCount } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      const { count: embeddedCount } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .not('embedding', 'is', null);

      // Test search function
      let searchStatus: 'working' | 'error' | 'unknown' = 'unknown';
      try {
        const { data, error } = await supabase.functions.invoke('knowledge-search', {
          body: { query: 'ISA revisjon test' }
        });
        
        if (error) {
          console.error('❌ Search function error:', error);
          searchStatus = 'error';
        } else if (data && data.articles) {
          searchStatus = 'working';
          console.log('✅ Search function working, returned', data.articles.length, 'results');
        }
      } catch (error) {
        console.error('❌ Search function exception:', error);
        searchStatus = 'error';
      }

      const health: KnowledgeBaseHealth = {
        totalArticles: totalCount || 0,
        publishedArticles: publishedCount || 0,
        articlesWithEmbeddings: embeddedCount || 0,
        embeddingCoverage: publishedCount ? (embeddedCount || 0) / publishedCount : 0,
        searchFunctionStatus: searchStatus,
        lastChecked: new Date().toISOString()
      };

      console.log('📊 Health check completed in', Date.now() - startTime, 'ms:', health);
      return health;
    } catch (error) {
      console.error('💥 Health check failed:', error);
      throw error;
    }
  }

  static async runSyntheticQueries(): Promise<SearchDiagnostic[]> {
    console.log('🤖 Running synthetic query tests...');
    
    const testQueries = [
      'ISA 315 risikovurdering',
      'materialitet revisjon',
      'varelager kontroll',
      'årsoppgjør prosedyrer',
      'dokumentasjonskrav ISA 230',
      'regnskapslov',
      'revisjonsstandard',
      'internkontroll'
    ];

    const results: SearchDiagnostic[] = [];

    for (const query of testQueries) {
      const diagnostic = await this.testSingleQuery(query);
      results.push(diagnostic);
      this.diagnosticHistory.push(diagnostic);
    }

    // Keep only last 100 diagnostics
    if (this.diagnosticHistory.length > 100) {
      this.diagnosticHistory = this.diagnosticHistory.slice(-100);
    }

    return results;
  }

  static async testSingleQuery(query: string): Promise<SearchDiagnostic> {
    console.log(`🔍 Testing query: "${query}"`);
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let semanticResults = 0;
    let keywordResults = 0;
    let totalResults = 0;

    try {
      const { data, error } = await supabase.functions.invoke('knowledge-search', {
        body: { query }
      });

      if (error) {
        errors.push(`Search function error: ${error.message}`);
      } else if (data) {
        const articles = data.articles || [];
        totalResults = articles.length;
        
        // Try to determine if results came from semantic vs keyword search
        // This is approximate based on similarity scores
        semanticResults = articles.filter((a: any) => a.similarity > 0.7).length;
        keywordResults = totalResults - semanticResults;

        if (totalResults === 0) {
          warnings.push('No results returned for query');
        }
      }
    } catch (error) {
      errors.push(`Exception during search: ${error.message}`);
    }

    const responseTime = Date.now() - startTime;

    return {
      timestamp: new Date().toISOString(),
      query,
      semanticResults,
      keywordResults,
      totalResults,
      responseTime,
      errors,
      warnings
    };
  }

  static getDiagnosticHistory(): SearchDiagnostic[] {
    return [...this.diagnosticHistory];
  }

  static getPerformanceMetrics() {
    if (this.diagnosticHistory.length === 0) return null;

    const recentDiagnostics = this.diagnosticHistory.slice(-20);
    const avgResponseTime = recentDiagnostics.reduce((sum, d) => sum + d.responseTime, 0) / recentDiagnostics.length;
    const successRate = recentDiagnostics.filter(d => d.errors.length === 0).length / recentDiagnostics.length;
    const avgResults = recentDiagnostics.reduce((sum, d) => sum + d.totalResults, 0) / recentDiagnostics.length;

    return {
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100),
      avgResults: Math.round(avgResults * 10) / 10,
      totalTests: this.diagnosticHistory.length
    };
  }
}
