
import { supabase } from './supabase.ts';

// Enhanced knowledge search with better debugging and more permissive matching
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
    
    // If no specific terms, use broader context terms
    if (searchTerms.length === 0) {
      const contextTerms = getContextualTerms(context);
      searchTerms.push(...contextTerms);
      console.log(`🎯 Using contextual terms: ${contextTerms.join(', ')}`);
    }

    // Score articles with enhanced fuzzy matching - MUCH MORE PERMISSIVE
    const scoredArticles = scoreArticleRelevanceEnhanced(articles, searchTerms, message);
    
    console.log(`📊 After enhanced scoring: ${scoredArticles.length} articles found`);
    
    // Return TOP articles even with LOW scores (threshold lowered dramatically)
    const threshold = 0.1; // Very low threshold
    const relevantArticles = scoredArticles.filter(article => article.relevanceScore >= threshold);
    
    // If still no results, return the top 3 most recent articles as fallback
    const results = relevantArticles.length > 0 
      ? relevantArticles.slice(0, 6)
      : articles.slice(0, 3).map(article => ({ ...article, relevanceScore: 0.5 }));
    
    const finalResults = results.map(article => ({
      ...article,
      content: article.content.substring(0, 2000)
    }));
    
    console.log(`✅ Returning ${finalResults.length} enhanced articles:`);
    finalResults.forEach((article, index) => {
      console.log(`  ${index + 1}. "${article.title}" (score: ${article.relevanceScore?.toFixed(2) || 'N/A'})`);
    });

    return finalResults;

  } catch (error) {
    console.error('💥 Error in enhanced knowledge search:', error);
    // Return fallback articles even on error
    try {
      const { data: fallbackArticles } = await supabase
        .from('knowledge_articles')
        .select('id, title, content, summary, tags, reference_code, slug')
        .eq('status', 'published')
        .limit(3);
      
      if (fallbackArticles && fallbackArticles.length > 0) {
        console.log(`🆘 Returning ${fallbackArticles.length} fallback articles`);
        return fallbackArticles.map(article => ({ ...article, relevanceScore: 0.3 }));
      }
    } catch (fallbackError) {
      console.error('💥 Fallback also failed:', fallbackError);
    }
    return null;
  }
}

function extractSearchTermsEnhanced(query: string, context: string): string[] {
  const stopwords = ['og', 'eller', 'en', 'et', 'den', 'det', 'de', 'som', 'jeg', 'du', 'kan', 'skal', 'vil', 'har', 'er', 'på', 'i', 'til', 'av', 'for', 'med', 'om', 'hva', 'hvordan', 'når', 'hvor'];
  const terms = new Set<string>();
  
  // Expanded Norwegian revision terminology synonyms
  const synonymMap = {
    'revisjon': ['revisjon', 'audit', 'kontroll', 'revisor', 'revisjonsarbeid'],
    'risikovurdering': ['risikovurdering', 'risiko', 'risikoanalyse', 'risikoidentifikasjon', 'risikoområde'],
    'materialitet': ['materialitet', 'vesentlighet', 'vesentlig', 'material'],
    'dokumentasjon': ['dokumentasjon', 'arbeidspapir', 'dokumentering', 'arbeidspapirer', 'dokumenter'],
    'inntekt': ['inntekt', 'inntekter', 'omsetning', 'salg', 'revenue'],
    'gjeld': ['gjeld', 'forpliktelse', 'forpliktelser', 'liability'],
    'eiendel': ['eiendel', 'eiendeler', 'aktiva', 'asset'],
    'kontroller': ['kontroller', 'internkontroll', 'systemer', 'kontrollsystemer'],
    'standard': ['standard', 'standarder', 'retningslinje', 'retningslinjer'],
    'prosedyre': ['prosedyre', 'prosedyrer', 'handlinger', 'revisjonshandlinger']
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
      if (synonyms.includes(word) || word.includes(key) || key.includes(word)) {
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

  // Add revision-specific terms based on context and common questions
  const revisionTerms = ['revisjon', 'revisor', 'kontroll', 'standard', 'prosedyre', 'dokumentasjon'];
  revisionTerms.forEach(term => {
    if (query.toLowerCase().includes(term)) {
      terms.add(term);
    }
  });

  // Add contextual terms automatically for better coverage
  const contextTerms = getContextualTerms(context);
  contextTerms.forEach(term => terms.add(term));

  return Array.from(terms);
}

function getContextualTerms(context: string): string[] {
  const contextTerms = {
    'risk-assessment': ['risikovurdering', 'risiko', 'ISA 315', 'materialitet', 'kontrollrisiko', 'forretningsrisiko'],
    'documentation': ['dokumentasjon', 'arbeidspapir', 'ISA 230', 'revisjonsbevis', 'arbeidspapirer'],
    'client-detail': ['klient', 'selskap', 'bransje', 'risikoområde', 'kunde'],
    'collaboration': ['team', 'samarbeid', 'koordinering', 'prosjektledelse'],
    'general': ['revisjon', 'standard', 'prosedyre', 'ISA', 'revisor', 'kontroll']
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

      // Score each search term with MUCH more generous fuzzy matching
      searchTerms.forEach(term => {
        const termLower = term.toLowerCase();
        
        // Exact word matches (highest score)
        const exactMatches = (searchText.match(new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')) || []).length;
        
        // Partial/substring matches (medium score)
        const partialMatches = searchText.includes(termLower) ? 1 : 0;
        
        // Fuzzy matches for common variations (lowest but still valuable score)
        const fuzzyMatches = searchText.includes(termLower.substring(0, Math.max(3, Math.floor(termLower.length * 0.7)))) ? 1 : 0;
        
        if (exactMatches > 0 || partialMatches > 0 || fuzzyMatches > 0) {
          let weight = 1;
          
          // Weight adjustments - more generous
          if (termLower.includes('isa')) weight = 8; // Reduced from 15
          if (article.title.toLowerCase().includes(termLower)) weight = Math.max(weight, 5); // Reduced from 8
          if (article.reference_code && article.reference_code.toLowerCase().includes(termLower)) weight = Math.max(weight, 6); // Reduced from 12
          if (term.length > 6) weight = Math.max(weight, 2); // Reduced from 3
          
          // More generous scoring
          score += (exactMatches * weight) + (partialMatches * weight * 0.7) + (fuzzyMatches * weight * 0.3);
          matchedTerms.add(term);
          
          console.log(`  📈 "${article.title}": term "${term}" - exact: ${exactMatches}, partial: ${partialMatches}, fuzzy: ${fuzzyMatches} (weight: ${weight})`);
        }
      });

      // Much more generous topic bonus
      const topicBonus = calculateTopicRelevance(article, originalQuery);
      score += topicBonus;

      // Base score for all revision-related articles (ensure articles are never completely filtered out)
      const baseRevisionScore = 0.2;
      score += baseRevisionScore;

      console.log(`  ⭐ "${article.title}": final score ${score.toFixed(2)} (topic bonus: ${topicBonus}, base: ${baseRevisionScore}, matched: ${[...matchedTerms].join(', ')})`);

      return {
        ...article,
        relevanceScore: score,
        matchedTerms: [...matchedTerms]
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function calculateTopicRelevance(article: any, query: string): number {
  const queryLower = query.toLowerCase();
  let bonus = 0;
  
  // Much more generous topic matching
  const revisionTopics = ['revisjon', 'kontroll', 'standard', 'prosedyre', 'dokumentasjon', 'risikovurdering', 'materialitet'];
  revisionTopics.forEach(topic => {
    if (queryLower.includes(topic) && article.content.toLowerCase().includes(topic)) {
      bonus += 1; // Increased from 0.5
    }
  });
  
  // ISA standards get significant bonus
  if (queryLower.includes('isa') && article.content.toLowerCase().includes('isa')) {
    bonus += 3; // Increased from 2
  }
  
  // Specific areas get good bonus
  const specificAreas = ['inntekt', 'gjeld', 'eiendel', 'balanse', 'resultat'];
  specificAreas.forEach(area => {
    if (queryLower.includes(area) && article.content.toLowerCase().includes(area)) {
      bonus += 1.5;
    }
  });
  
  return bonus;
}
