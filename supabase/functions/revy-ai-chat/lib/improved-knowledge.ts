
import { supabase } from './supabase.ts';

// Enhanced knowledge search with better debugging and fuzzy matching
export async function searchRelevantKnowledgeImproved(message: string, context: string) {
  console.log(`🔍 IMPROVED: Starting enhanced knowledge search for: "${message}"`);
  
  try {
    // First, let's get a count of all published articles
    const { count: totalPublished, error: countError } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    console.log(`📊 Total published articles in database: ${totalPublished}`);
    
    if (countError) {
      console.error('❌ Error counting articles:', countError);
      return null;
    }
    
    if (!totalPublished || totalPublished === 0) {
      console.log('❌ No published articles found');
      return null;
    }

    // Get all published articles with full data
    const { data: articles, error: fetchError } = await supabase
      .from('knowledge_articles')
      .select(`
        id,
        title,
        content,
        summary,
        tags,
        reference_code,
        slug,
        created_at,
        published_at
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching articles:', fetchError);
      return null;
    }

    console.log(`✅ Successfully fetched ${articles?.length || 0} articles`);
    
    if (!articles || articles.length === 0) {
      console.log('❌ No articles returned from query');
      return null;
    }

    // Enhanced search terms extraction with better fuzzy matching
    const searchTerms = extractSearchTermsEnhanced(message, context);
    console.log(`🔑 Enhanced search terms: ${searchTerms.join(', ')}`);
    
    // More permissive search - if no specific terms, use broader context terms
    if (searchTerms.length === 0) {
      const contextTerms = getContextualTerms(context);
      searchTerms.push(...contextTerms);
      console.log(`🎯 Using contextual terms: ${contextTerms.join(', ')}`);
    }

    // Score articles with enhanced fuzzy matching
    const scoredArticles = scoreArticleRelevanceEnhanced(articles, searchTerms, message);
    
    console.log(`📊 After enhanced scoring: ${scoredArticles.length} relevant articles`);
    
    // Be more permissive - return articles even with low scores
    const results = scoredArticles.slice(0, 8).map(article => ({
      ...article,
      content: article.content.substring(0, 2000)
    }));
    
    console.log(`✅ Returning ${results.length} enhanced articles:`);
    results.forEach((article, index) => {
      console.log(`  ${index + 1}. "${article.title}" (score: ${article.relevanceScore?.toFixed(2)})`);
    });

    return results;

  } catch (error) {
    console.error('💥 Error in enhanced knowledge search:', error);
    return null;
  }
}

function extractSearchTermsEnhanced(query: string, context: string): string[] {
  const stopwords = ['og', 'eller', 'en', 'et', 'den', 'det', 'de', 'som', 'jeg', 'du', 'kan', 'skal', 'vil', 'har', 'er', 'på', 'i', 'til', 'av', 'for', 'med', 'om'];
  const terms = new Set<string>();
  
  // Norwegian revision terminology synonyms
  const synonymMap = {
    'revisjon': ['revisjon', 'audit', 'kontroll'],
    'risikovurdering': ['risikovurdering', 'risiko', 'risikoanalyse', 'risikoidentifikasjon'],
    'materialitet': ['materialitet', 'vesentlighet'],
    'dokumentasjon': ['dokumentasjon', 'arbeidspapir', 'dokumentering'],
    'inntekt': ['inntekt', 'inntekter', 'omsetning', 'salg'],
    'gjeld': ['gjeld', 'forpliktelse', 'forpliktelser'],
    'eiendel': ['eiendel', 'eiendeler', 'aktiva'],
    'kontroller': ['kontroller', 'internkontroll', 'systemer']
  };

  // Extract words of 2+ characters (more permissive)
  const words = query.toLowerCase()
    .replace(/[^\w\såæøäöü]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopwords.includes(word));
  
  words.forEach(word => {
    terms.add(word);
    // Add synonyms
    Object.entries(synonymMap).forEach(([key, synonyms]) => {
      if (synonyms.includes(word)) {
        synonyms.forEach(synonym => terms.add(synonym));
      }
    });
  });

  // Enhanced ISA pattern matching
  const isaMatches = query.match(/isa\s*\d{3}/gi) || [];
  isaMatches.forEach(match => {
    const cleanMatch = match.replace(/\s+/g, ' ').trim().toUpperCase();
    terms.add(cleanMatch);
    terms.add('ISA');
    terms.add('standard');
    terms.add('revisjonsstandard');
  });

  // Add revision-specific terms based on context
  const revisionTerms = ['revisjon', 'revisor', 'kontroll', 'standard', 'prosedyre', 'dokumentasjon'];
  revisionTerms.forEach(term => {
    if (query.toLowerCase().includes(term)) {
      terms.add(term);
    }
  });

  return Array.from(terms);
}

function getContextualTerms(context: string): string[] {
  const contextTerms = {
    'risk-assessment': ['risikovurdering', 'risiko', 'ISA 315', 'materialitet', 'kontrollrisiko'],
    'documentation': ['dokumentasjon', 'arbeidspapir', 'ISA 230', 'revisjonsbevis'],
    'client-detail': ['klient', 'selskap', 'bransje', 'risikoområde'],
    'collaboration': ['team', 'samarbeid', 'koordinering', 'prosjektledelse'],
    'general': ['revisjon', 'standard', 'prosedyre', 'ISA']
  };
  
  return contextTerms[context as keyof typeof contextTerms] || contextTerms.general;
}

function scoreArticleRelevanceEnhanced(articles: any[], searchTerms: string[], originalQuery: string): any[] {
  console.log(`📊 Enhanced scoring ${articles.length} articles against ${searchTerms.length} search terms`);
  
  return articles
    .map(article => {
      let score = 0;
      const matchedTerms = new Set<string>();
      
      // Create searchable text
      const searchText = `${article.title} ${article.summary || ''} ${article.content} ${(article.tags || []).join(' ')} ${article.reference_code || ''}`.toLowerCase();

      // Score each search term with fuzzy matching
      searchTerms.forEach(term => {
        const termLower = term.toLowerCase();
        
        // Exact matches
        const exactMatches = (searchText.match(new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')) || []).length;
        
        // Partial matches (substring)
        const partialMatches = searchText.includes(termLower) ? 1 : 0;
        
        if (exactMatches > 0 || partialMatches > 0) {
          let weight = 1;
          
          // Higher weight for ISA terms
          if (termLower.includes('isa')) weight = 15;
          // Higher weight for exact matches in title
          if (article.title.toLowerCase().includes(termLower)) weight = Math.max(weight, 8);
          // Higher weight for reference code matches
          if (article.reference_code && article.reference_code.toLowerCase().includes(termLower)) weight = Math.max(weight, 12);
          // Higher weight for longer, more specific terms
          if (term.length > 6) weight = Math.max(weight, 3);
          
          score += (exactMatches * weight) + (partialMatches * weight * 0.5);
          matchedTerms.add(term);
          console.log(`  📈 "${article.title}": term "${term}" - exact: ${exactMatches}, partial: ${partialMatches} (weight: ${weight})`);
        }
      });

      // Bonus for articles that match the general topic even without specific terms
      const topicBonus = calculateTopicRelevance(article, originalQuery);
      score += topicBonus;

      console.log(`  ⭐ "${article.title}": final score ${score.toFixed(2)} (topic bonus: ${topicBonus}, matched: ${[...matchedTerms].join(', ')})`);

      return {
        ...article,
        relevanceScore: score,
        matchedTerms: [...matchedTerms]
      };
    })
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function calculateTopicRelevance(article: any, query: string): number {
  const queryLower = query.toLowerCase();
  let bonus = 0;
  
  // General revision topics
  const revisionTopics = ['revisjon', 'kontroll', 'standard', 'prosedyre', 'dokumentasjon'];
  revisionTopics.forEach(topic => {
    if (queryLower.includes(topic) && article.content.toLowerCase().includes(topic)) {
      bonus += 0.5;
    }
  });
  
  // ISA standards
  if (queryLower.includes('isa') && article.content.toLowerCase().includes('isa')) {
    bonus += 2;
  }
  
  // Specific areas
  if (queryLower.includes('inntekt') && article.content.toLowerCase().includes('inntekt')) {
    bonus += 1;
  }
  
  return bonus;
}
