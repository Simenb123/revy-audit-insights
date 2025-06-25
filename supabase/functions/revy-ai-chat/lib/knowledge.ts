
import { getScopedClient } from './supabase.ts';
import { log } from '../_shared/log.ts';

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

// Improved search terms extraction
export const extractSearchTerms = (query: string, context: string): string[] => {
  log(`🔍 Extracting search terms from: "${query}"`);
  const terms = new Set<string>();

  // Norwegian stopwords to exclude
  const stopwords = ['og', 'eller', 'en', 'et', 'den', 'det', 'de', 'som', 'jeg', 'du', 'han', 'hun', 'vi', 'dere', 'til', 'av', 'for', 'på', 'med', 'i', 'å', 'er', 'var', 'har', 'kan', 'skal', 'vil', 'må', 'om', 'hvis', 'når', 'hvor', 'hva', 'hvem', 'hvorfor', 'hvordan'];

  // Extract meaningful words (3+ characters, not stopwords)
  const words = query.toLowerCase()
    .replace(/[^\w\såæøäöü]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopwords.includes(word));
    
  words.forEach(word => {
    terms.add(word);
    log(`📝 Added search term: "${word}"`);
  });

  // Enhanced ISA standards extraction
  const isaMatches = query.match(/isa\s*\d{3}/gi);
  if (isaMatches) {
    isaMatches.forEach(match => {
      const cleanMatch = match.replace(/\s+/g, ' ').trim().toUpperCase();
      terms.add(cleanMatch);
      terms.add('ISA');
      log(`📋 Added ISA term: "${cleanMatch}"`);
    });
  }

  // Add key revision terms
  const revisionTerms = ['revisjon', 'revisor', 'regnskap', 'kontroll', 'standard', 'prosedyre'];
  revisionTerms.forEach(term => {
    if (query.toLowerCase().includes(term)) {
      terms.add(term);
      log(`🎯 Added revision term: "${term}"`);
    }
  });

  const finalTerms = Array.from(terms);
  log(`✅ Final search terms (${finalTerms.length}): ${finalTerms.join(', ')}`);
  return finalTerms;
};

export const scoreArticleRelevance = (articles: any[], searchTerms: string[]): any[] => {
  log(`📊 Scoring ${articles.length} articles against ${searchTerms.length} search terms`);
  
  return articles
    .map(article => {
      let score = 0;
      const matchedTerms = new Set<string>();
      
      // Create searchable text
      const searchText = `${article.title} ${article.summary || ''} ${article.content} ${(article.tags || []).join(' ')} ${article.reference_code || ''}`.toLowerCase();

      // Score each search term
      searchTerms.forEach(term => {
        const termLower = term.toLowerCase();
        const regex = new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
        const matches = searchText.match(regex) || [];
        
        if (matches.length > 0) {
          let weight = 1;
          
          // Higher weight for ISA terms
          if (termLower.includes('isa')) weight = 10;
          // Higher weight for exact matches in title
          if (article.title.toLowerCase().includes(termLower)) weight = Math.max(weight, 5);
          // Higher weight for longer, more specific terms
          if (term.length > 5) weight = Math.max(weight, 2);
          
          score += matches.length * weight;
          matchedTerms.add(term);
          log(`  📈 "${article.title}": term "${term}" matched ${matches.length} times (weight: ${weight})`);
        }
      });

      // Bonus for reference code matches
      if (article.reference_code) {
        searchTerms.forEach(term => {
          if (article.reference_code.toLowerCase().includes(term.toLowerCase())) {
            score += 15;
            log(`  🔖 "${article.title}": reference code bonus for "${term}"`);
          }
        });
      }

      log(`  ⭐ "${article.title}": final score ${score.toFixed(2)} (matched: ${[...matchedTerms].join(', ')})`);

      return {
        ...article,
        relevanceScore: score,
        matchedTerms: [...matchedTerms]
      };
    })
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

export async function searchRelevantKnowledge(req: Request, message: string, context: string) {
  const supabase = getScopedClient(req);
  try {
    log(`🔎 Starting knowledge search for: "${message}" in context: "${context}"`);
    
    // First check if we have any published articles at all
    const { count: totalCount } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    log(`📊 Total published articles available: ${totalCount}`);
    
    if (!totalCount || totalCount === 0) {
      log('❌ No published articles found in database');
      return null;
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Try semantic search if OpenAI key available
    if (openAIApiKey) {
      log(`🧠 Attempting semantic search...`);
      
      try {
        const queryEmbedding = await getEmbedding(message, openAIApiKey);

        const { data: articles, error } = await supabase.rpc('match_knowledge_articles', {
          p_query_embedding: queryEmbedding,
          p_match_threshold: 0.3, // Lower threshold for more matches
          p_match_count: 10,
        });

        if (error) {
          console.error('❌ Error calling match_knowledge_articles:', error);
        } else if (articles && articles.length > 0) {
          log(`✅ Semantic search found ${articles.length} articles`);
          return articles.map((a: any) => ({...a, content: a.content.substring(0, 2000)}));
        } else {
          log('ℹ️ Semantic search returned no results, falling back to keyword search');
        }
      } catch (semanticError) {
        console.error('⚠️ Semantic search failed:', semanticError);
      }
    }
    
    // Fallback to improved keyword search
    log('🔄 Using keyword search');
    return keywordSearch(req, message, context);

  } catch (error) {
    console.error('💥 Error in searchRelevantKnowledge:', error);
    return keywordSearch(req, message, context);
  }
}

async function keywordSearch(req: Request, message: string, context: string) {
  const supabase = getScopedClient(req);
  log(`🔑 Starting keyword search for: "${message}"`);
  
  const searchTerms = extractSearchTerms(message, context);
  if (searchTerms.length === 0) {
    log('❌ No search terms extracted');
    return null;
  }

  try {
    // Get all published articles first
    const { data: allArticles, error } = await supabase
      .from('knowledge_articles')
      .select(`
        id,
        title,
        content,
        summary,
        view_count,
        slug,
        published_at,
        created_at,
        reference_code,
        article_tags:knowledge_article_tags(
          tag:tags(name)
        )
      `)
      .eq('status', 'published');

    if (error) {
      console.error('❌ Database query error:', error);
      return null;
    }
    
    log(`📄 Retrieved ${allArticles?.length || 0} published articles for scoring`);

    if (!allArticles || allArticles.length === 0) {
      log('❌ No published articles found');
      return null;
    }

    // Score and filter articles
    const articlesWithTags = allArticles.map(article => ({
      ...article,
      tags: (article.article_tags || []).map((at: any) => at.tag?.name).filter(Boolean)
    }));

    const scoredArticles = scoreArticleRelevance(articlesWithTags, searchTerms);
    
    log(`📊 After scoring: ${scoredArticles.length} relevant articles`);
    
    if (scoredArticles.length === 0) {
      log('❌ No articles passed relevance scoring');
      return null;
    }

    // Return top results with truncated content
    const results = scoredArticles.slice(0, 6).map(article => ({
      ...article,
      content: article.content.substring(0, 2000)
    }));
    
    log(`✅ Returning ${results.length} top-scored articles:`);
    results.forEach((article, index) => {
      log(`  ${index + 1}. "${article.title}" (score: ${article.relevanceScore?.toFixed(2)})`);
    });

    return results;
    
  } catch (error) {
    console.error('💥 Error in keyword search:', error);
    return null;
  }
}
