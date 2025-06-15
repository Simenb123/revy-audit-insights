
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
  console.log(`🔍 Extracting search terms from: "${query}"`);
  const terms = new Set<string>();

  // Split query into words and add all meaningful terms (no minimum length filter)
  const words = query.toLowerCase()
    .replace(/[^\w\såæøäöü]/g, ' ') // Replace punctuation with spaces, keep Nordic chars
    .split(/\s+/)
    .filter(term => term.length > 0); // Only filter out empty strings
    
  words.forEach(word => {
    terms.add(word);
    console.log(`📝 Added search term: "${word}"`);
  });

  // Enhanced ISA standards extraction
  const isaPatterns = [
    /isa\s*\d{3}/gi,  // ISA 200, ISA200, etc.
    /isa\s+\d{3}/gi,  // ISA 200 with space
    /\bisa\b/gi       // Just "ISA" as standalone word
  ];
  
  isaPatterns.forEach(pattern => {
    const matches = query.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.replace(/\s+/g, ' ').trim().toUpperCase();
        terms.add(cleanMatch);
        terms.add('ISA'); // Always add ISA as a separate term
        console.log(`📋 Added ISA term: "${cleanMatch}"`);
      });
    }
  });

  // Add context-specific terms for better targeting
  const contextTerms: Record<string, string[]> = {
    'risk-assessment': ['risiko', 'vurdering', 'materialitet'],
    'client-detail': ['klient', 'selskap', 'regnskap'],
    'documentation': ['dokumentasjon', 'arbeidspapir', 'bevis'],
    'audit-actions': ['handlinger', 'prosedyrer', 'testing'],
  };

  if (contextTerms[context]) {
    contextTerms[context].forEach(term => {
      terms.add(term);
      console.log(`🎯 Added context term for ${context}: "${term}"`);
    });
  }

  const finalTerms = [...terms];
  console.log(`✅ Final search terms (${finalTerms.length}): ${finalTerms.join(', ')}`);
  return finalTerms;
};

export const scoreArticleRelevance = (articles: any[], searchTerms: string[]): any[] => {
  console.log(`📊 Scoring ${articles.length} articles against ${searchTerms.length} search terms`);
  
  return articles
    .map(article => {
      let score = 0;
      const matchedTerms = new Set<string>();
      const searchText = `${article.title} ${article.summary || ''} ${article.content} ${(article.tags || []).join(' ')}`.toLowerCase();

      // Score each search term
      searchTerms.forEach(term => {
        const termLower = term.toLowerCase();
        const termPattern = new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const termCount = (searchText.match(termPattern) || []).length;
        
        if (termCount > 0) {
          let weight = 1;
          
          // Higher weight for ISA terms
          if (termLower.includes('isa')) weight = 5;
          // Higher weight for longer, more specific terms
          if (term.length > 4) weight = Math.max(weight, 2);
          
          score += termCount * weight;
          matchedTerms.add(term);
          console.log(`  📈 "${article.title}": term "${term}" matched ${termCount} times (weight: ${weight})`);
        }
      });

      // Extra points for title matches
      searchTerms.forEach(term => {
        if (article.title.toLowerCase().includes(term.toLowerCase())) {
          score += 10;
          console.log(`  🎯 "${article.title}": bonus for title match with "${term}"`);
        }
      });
      
      // Extra points for tag matches
      if (article.tags && Array.isArray(article.tags)) {
        searchTerms.forEach(term => {
          if (article.tags.some((tag: string) => typeof tag === 'string' && tag.toLowerCase().includes(term.toLowerCase()))) {
            score += 3;
            console.log(`  🏷️ "${article.title}": bonus for tag match with "${term}"`);
          }
        });
      }

      // Small boost for popular articles
      score += Math.log1p(article.view_count || 0) * 0.1;

      console.log(`  ⭐ "${article.title}": final score ${score.toFixed(2)} (matched: ${[...matchedTerms].join(', ')})`);

      return {
        ...article,
        relevanceScore: score,
        matchedTerms: [...matchedTerms]
      };
    })
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

export async function searchRelevantKnowledge(message: string, context: string) {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log(`🔎 Starting knowledge search for: "${message}" in context: "${context}"`);
    
    // Try semantic search first if we have OpenAI API key
    if (openAIApiKey) {
      console.log(`🧠 Attempting semantic search...`);
      
      try {
        const queryEmbedding = await getEmbedding(message, openAIApiKey);

        const { data: articles, error } = await supabase.rpc('match_knowledge_articles', {
          p_query_embedding: queryEmbedding,
          p_match_threshold: 0.6, // Lowered threshold for more matches
          p_match_count: 8,
        });

        if (error) {
          console.error('❌ Error calling match_knowledge_articles:', error);
        } else if (articles && articles.length > 0) {
          console.log(`✅ Semantic search found ${articles.length} articles`);
          return articles.map(a => ({...a, content: a.content.substring(0, 1500)}));
        } else {
          console.log('ℹ️ Semantic search returned no results');
        }
      } catch (semanticError) {
        console.error('⚠️ Semantic search failed:', semanticError);
      }
    } else {
      console.log('⚠️ No OpenAI API key found, skipping semantic search');
    }
    
    // Fallback to keyword search
    console.log('🔄 Falling back to keyword search');
    return keywordSearch(message, context);

  } catch (error) {
    console.error('💥 Error in searchRelevantKnowledge:', error);
    return keywordSearch(message, context);
  }
}

async function keywordSearch(message: string, context: string) {
  console.log(`🔑 Starting keyword search for: "${message}"`);
  
  const searchTerms = extractSearchTerms(message, context);
  if (searchTerms.length === 0) {
    console.log('❌ No search terms extracted');
    return null;
  }

  // Create simpler, more inclusive search conditions
  console.log(`🔍 Creating database query for ${searchTerms.length} terms`);
  
  // Build OR conditions for each field
  const conditions = searchTerms.flatMap(term => [
    `title.ilike.%${term}%`,
    `content.ilike.%${term}%`,
    `summary.ilike.%${term}%`,
    `tags.cs.{${term}}` // Contains search for tags array
  ]);

  console.log(`📝 Database query with ${conditions.length} OR conditions`);

  const { data: articles, error } = await supabase
    .from('knowledge_articles')
    .select('id, title, content, summary, tags, view_count, slug, published_at, created_at, reference_code, valid_from, valid_until')
    .eq('status', 'published')
    .or(conditions.join(','))
    .limit(20);

  if (error) {
    console.error('❌ Database query error:', error);
    return null;
  }
  
  console.log(`📄 Raw database results: ${articles?.length || 0} articles found`);
  
  if (!articles || articles.length === 0) {
    console.log('❌ No articles found in database');
    
    // Let's also try a simple count to see if there are any published articles at all
    const { count } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    console.log(`📊 Total published articles in database: ${count}`);
    return null;
  }

  // Score and rank the results
  const scoredArticles = scoreArticleRelevance(articles, searchTerms);
  
  console.log(`📊 After scoring: ${scoredArticles.length} relevant articles`);
  
  if (scoredArticles.length === 0) {
    console.log('❌ No articles passed relevance scoring');
    return null;
  }

  // Return top results with truncated content
  const results = scoredArticles.slice(0, 6).map(article => ({
    ...article,
    content: article.content.substring(0, 1500)
  }));
  
  console.log(`✅ Returning ${results.length} top-scored articles:`);
  results.forEach((article, index) => {
    console.log(`  ${index + 1}. "${article.title}" (score: ${article.relevanceScore.toFixed(2)})`);
  });

  return results;
}
