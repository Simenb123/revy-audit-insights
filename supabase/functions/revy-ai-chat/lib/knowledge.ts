
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

  // Add query terms - removed length filter to allow important short terms like "ISA"
  query.toLowerCase().split(/\s+/).filter(term => term.length > 1).forEach(term => terms.add(term));

  // Enhanced ISA standards extraction - now includes "ISA" as a term
  const isaPattern = /isa\s*\d{3}/gi;
  const isaMatches = query.match(isaPattern);
  if (isaMatches) {
    isaMatches.forEach(match => {
      terms.add(match.toUpperCase().replace(/\s+/g, ' '));
      terms.add('ISA'); // Add ISA as a separate term
    });
  }
  
  // Also add "ISA" if mentioned without numbers
  if (query.toLowerCase().includes('isa')) {
    terms.add('ISA');
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

  console.log(`🔍 Extracted search terms: ${[...terms].join(', ')}`);
  return [...terms];
};

export const scoreArticleRelevance = (articles: any[], searchTerms: string[]): any[] => {
  console.log(`📊 Scoring ${articles.length} articles against ${searchTerms.length} search terms`);
  
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
    .filter(result => result.relevanceScore > 0) // Lowered threshold from 2 to 0
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
      p_match_threshold: 0.65,
      p_match_count: 5,
    });

    if (error) {
      console.error('Error calling match_knowledge_articles:', error);
      console.log('🔄 Falling back to keyword search due to semantic search error');
      return keywordSearch(message, context);
    }
    
    if (articles && articles.length > 0) {
      console.log(`✅ Found ${articles.length} relevant articles via semantic search.`);
      return articles.map(a => ({...a, content: a.content.substring(0, 1500)}));
    }
    
    console.log('🔄 No strong semantic matches found, falling back to keyword search.');
    return keywordSearch(message, context);

  } catch (error) {
    console.error('Semantic knowledge search error:', error);
    console.log('🔄 Falling back to keyword search due to error');
    return keywordSearch(message, context);
  }
}

async function keywordSearch(message: string, context: string) {
    const searchTerms = extractSearchTerms(message, context);
    if (searchTerms.length === 0) {
        console.log('❌ No search terms extracted');
        return null;
    }

    console.log(`🔑 Keyword search with ${searchTerms.length} terms: ${searchTerms.join(', ')}`);
    
    // Create a more flexible search query that searches across multiple fields
    const orConditions = searchTerms.flatMap(term => [
        `title.ilike.%${term}%`,
        `content.ilike.%${term}%`,
        `summary.ilike.%${term}%`
    ]);

    console.log(`🔍 Database query conditions: ${orConditions.length} OR conditions`);

    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select('title, content, summary, tags, view_count, slug, published_at, created_at, reference_code, valid_from, valid_until')
      .eq('status', 'published')
      .or(orConditions.join(','))
      .limit(20); // Increased limit to get more potential matches

    if (error) {
      console.error('❌ Error fetching knowledge articles (keyword):', error);
      return null;
    }
    
    console.log(`📄 Raw database results: ${articles?.length || 0} articles found`);
    
    if (!articles || articles.length === 0) {
        console.log('❌ No articles found in database with keyword search');
        return null;
    }

    const scoredArticles = scoreArticleRelevance(articles, searchTerms);
    
    console.log(`📊 After scoring: ${scoredArticles.length} relevant articles (scores > 0)`);
    scoredArticles.forEach((article, index) => {
        console.log(`  ${index + 1}. "${article.title}" (score: ${article.relevanceScore.toFixed(2)}, matched: ${article.matchedTerms.join(', ')})`);
    });

    const results = scoredArticles.length > 0 ? scoredArticles.slice(0, 5) : null;
    
    if (results) {
        console.log(`✅ Returning ${results.length} top-scored articles`);
        return results.map(a => ({...a, content: a.content.substring(0, 1500)}));
    } else {
        console.log('❌ No articles passed relevance scoring');
        return null;
    }
}
