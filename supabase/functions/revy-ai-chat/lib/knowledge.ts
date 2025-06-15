
import { supabase } from './supabase.ts';

// --- Knowledge search logic ---

export const extractSearchTerms = (query: string, context: string): string[] => {
  const terms = new Set<string>();

  // Add query terms, filtering out small words
  query.toLowerCase().split(/\s+/).filter(term => term.length > 2).forEach(term => terms.add(term));

  // Extract ISA standards
  const isaPattern = /isa\s*\d{3}/gi;
  const isaMatches = query.match(isaPattern);
  if (isaMatches) {
    isaMatches.forEach(match => terms.add(match.toUpperCase().replace(/\s+/g, ' ')));
  }

  // Add context-specific terms
  const contextTerms: Record<string, string[]> = {
    'risk-assessment': ['risiko', 'vurdering', 'materialitet', 'vesentlighet', 'kontrollmiljø'],
    'client-detail': ['klient', 'selskap', 'bransje', 'regnskap', 'nøkkeltall'],
    'documentation': ['dokumentasjon', 'arbeidspapir', 'bevis', 'ISA 230', 'konklusjon'],
    'audit-actions': ['handlinger', 'prosedyrer', 'testing', 'kontroll', 'substans'],
  };

  if (contextTerms[context]) {
    contextTerms[context].forEach(term => terms.add(term));
  }

  return [...terms];
};

export const scoreArticleRelevance = (articles: any[], searchTerms: string[]): any[] => {
  return articles
    .map(article => {
      let score = 0;
      const matchedTerms = new Set<string>();
      const searchText = `${article.title} ${article.summary || ''} ${article.content} ${(article.tags || []).join(' ')}`.toLowerCase();

      searchTerms.forEach(term => {
        const termPattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const termCount = (searchText.match(termPattern) || []).length;
        if (termCount > 0) {
          let weight = term.length > 4 ? 2 : 1;
          if (term.toLowerCase().startsWith('isa')) weight = 10;
          score += termCount * weight;
          matchedTerms.add(term);
        }
      });

      searchTerms.forEach(term => {
        if (article.title.toLowerCase().includes(term.toLowerCase())) {
          score += 15;
        }
      });
      
      if (article.tags && Array.isArray(article.tags)) {
        searchTerms.forEach(term => {
            if (article.tags.some((tag: string) => typeof tag === 'string' && tag.toLowerCase().includes(term.toLowerCase()))) {
                score += 5;
            }
        });
      }

      score += Math.log1p(article.view_count || 0);

      return {
        ...article,
        relevanceScore: score,
        matchedTerms: [...matchedTerms]
      };
    })
    .filter(result => result.relevanceScore > 2)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

export async function searchRelevantKnowledge(message: string, context: string) {
  try {
    const searchTerms = extractSearchTerms(message, context);
    if (searchTerms.length === 0) return null;

    console.log(`🔎 Knowledge search terms: ${searchTerms.join(', ')}`);
    
    const orFilter = searchTerms.flatMap(term => [
        `title.ilike.%${term}%`,
        `content.ilike.%${term}%`,
        `summary.ilike.%${term}%`,
        `tags.cs.{${term}}`
    ]).join(',');

    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select('title, content, summary, tags, view_count, slug, published_at, created_at')
      .eq('status', 'published')
      .or(orFilter)
      .limit(15);

    if (error) {
      console.error('Error fetching knowledge articles:', error);
      return null;
    }
    
    if (!articles || articles.length === 0) {
        console.log('🧐 No initial articles found for terms.');
        return null;
    }

    const scoredArticles = scoreArticleRelevance(articles, searchTerms);
    
    console.log(`✅ Found ${scoredArticles.length} relevant articles after scoring.`);

    return scoredArticles.length > 0 ? scoredArticles.slice(0, 5) : null;
  } catch (error) {
    console.error('Knowledge search error:', error);
    return null;
  }
}
