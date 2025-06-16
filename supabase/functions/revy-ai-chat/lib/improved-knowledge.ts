
import { supabase } from './supabase.ts';

// Enhanced knowledge search with better debugging
export async function searchRelevantKnowledgeImproved(message: string, context: string) {
  console.log(`🔍 IMPROVED: Starting knowledge search for: "${message}"`);
  
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

    // Log article titles for debugging
    articles.forEach(article => {
      console.log(`📄 Found article: "${article.title}" (${article.reference_code || 'No ref'})`);
    });

    // Simple keyword matching for now
    const searchTerms = extractSearchTermsSimple(message);
    console.log(`🔑 Search terms: ${searchTerms.join(', ')}`);
    
    if (searchTerms.length === 0) {
      console.log('⚠️ No search terms found, returning all articles');
      return articles.slice(0, 3).map(article => ({
        ...article,
        content: article.content.substring(0, 1500)
      }));
    }

    // Score articles based on keyword matches
    const scoredArticles = articles.map(article => {
      let score = 0;
      const searchableText = `${article.title} ${article.summary || ''} ${article.content} ${(article.tags || []).join(' ')}`.toLowerCase();
      
      searchTerms.forEach(term => {
        const termLower = term.toLowerCase();
        const matches = (searchableText.match(new RegExp(termLower, 'g')) || []).length;
        score += matches;
        
        // Bonus for title matches
        if (article.title.toLowerCase().includes(termLower)) {
          score += 5;
        }
        
        // Bonus for reference code matches
        if (article.reference_code && article.reference_code.toLowerCase().includes(termLower)) {
          score += 10;
        }
      });
      
      console.log(`📊 Article "${article.title}": score ${score}`);
      
      return {
        ...article,
        relevanceScore: score
      };
    });

    const relevantArticles = scoredArticles
      .filter(article => article.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    console.log(`✅ Returning ${relevantArticles.length} relevant articles`);

    return relevantArticles.map(article => ({
      ...article,
      content: article.content.substring(0, 1500)
    }));

  } catch (error) {
    console.error('💥 Error in improved knowledge search:', error);
    return null;
  }
}

function extractSearchTermsSimple(query: string): string[] {
  const stopwords = ['og', 'eller', 'en', 'et', 'den', 'det', 'de', 'som', 'jeg', 'du', 'kan', 'skal', 'vil'];
  
  // Extract words of 3+ characters
  const words = query.toLowerCase()
    .replace(/[^\w\såæøäöü]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopwords.includes(word));
  
  // Add ISA pattern matching
  const isaMatches = query.match(/isa\s*\d{3}/gi) || [];
  
  return [...new Set([...words, ...isaMatches.map(m => m.toUpperCase())])];
}
