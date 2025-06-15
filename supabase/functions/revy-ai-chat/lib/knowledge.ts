import { supabase } from './supabase.ts';

async function getEmbedding(text: string, openAIApiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI embedding API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.warn('OPENAI_API_KEY not set, falling back to keyword search.');
      return keywordSearch(message, context);
    }

    console.log(`🔎 Performing semantic knowledge search for: "${message}"`);
    
    const queryEmbedding = await getEmbedding(message, openAIApiKey);

    const { data: articles, error } = await supabase.rpc('match_knowledge_articles', {
      p_query_embedding: queryEmbedding,
      p_match_threshold: 0.65, // Lowered from 0.7 to find more matches
      p_match_count: 5,
    });

    if (error) {
      console.error('Error calling match_knowledge_articles:', error);
      return keywordSearch(message, context);
    }
    
    if (articles && articles.length > 0) {
      console.log(`✅ Found ${articles.length} relevant articles via semantic search.`);
      return articles.map(a => ({...a, content: a.content.substring(0, 1500)}));
    }
    
    console.log('🧐 No strong semantic matches found, falling back to keyword search.');
    return keywordSearch(message, context);

  } catch (error) {
    console.error('Semantic knowledge search error:', error);
    return keywordSearch(message, context);
  }
}

async function keywordSearch(message: string, context: string) {
    const searchTerms = extractSearchTerms(message, context);
    if (searchTerms.length === 0) return null;

    console.log(`🔑 Keyword search terms: ${searchTerms.join(', ')}`);
    
    const orFilter = searchTerms.flatMap(term => [
        `title.ilike.%${term}%`,
        `content.ilike.%${term}%`,
        `summary.ilike.%${term}%`
        // `tags.cs.{${term}}` // Temporarily removed to prevent a potential database error. Tags are still used for scoring relevance.
    ]).join(',');

    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select('title, content, summary, tags, view_count, slug, published_at, created_at, reference_code, valid_from, valid_until')
      .eq('status', 'published')
      .or(orFilter)
      .limit(15);

    if (error) {
      console.error('Error fetching knowledge articles (keyword):', error);
      return null;
    }
    
    if (!articles || articles.length === 0) {
        console.log('🧐 No keyword-based articles found.');
        return null;
    }

    const scoredArticles = scoreArticleRelevance(articles, searchTerms);
    
    console.log(`✅ Found ${scoredArticles.length} relevant articles after keyword scoring.`);

    const results = scoredArticles.length > 0 ? scoredArticles.slice(0, 5) : null;
    return results ? results.map(a => ({...a, content: a.content.substring(0, 1500)})) : null;
}
