import { supabase } from './supabase.ts';
import { extractIntelligentKeywords } from './utils.ts';

interface KnowledgeSearchResult {
  title: string;
  summary: string;
  slug: string;
  category: string;
  tags: string[];
  reference_code: string;
  relevanceScore: number;
}

interface ArticleTagMapping {
  articleSlug: string;
  articleTitle: string;
  matchedTags: string[];
  relevanceScore: number;
}

interface EnhancedKnowledgeResult {
  articles: KnowledgeSearchResult[];
  tagToArticleMap: Record<string, ArticleTagMapping>;
}

export async function searchKnowledgeIntelligently(
  message: string, 
  context: string, 
  clientData?: any
): Promise<EnhancedKnowledgeResult> {
  try {
    console.log('🔍 Starting intelligent knowledge search with article mapping...');
    console.log(`📝 Message: "${message}"`);
    console.log(`🎯 Context: "${context}"`);
    
    // First check if we have any published articles at all
    const { count: totalCount, error: countError } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (countError) {
      console.error('❌ Error checking article count:', countError);
      return { articles: [], tagToArticleMap: {} };
    }
    
    console.log(`📊 Total published articles available: ${totalCount || 0}`);
    
    if (!totalCount || totalCount === 0) {
      console.log('❌ No published articles found in database');
      return { articles: [], tagToArticleMap: {} };
    }

    // Extract keywords from the message
    const keywords = extractIntelligentKeywords(message, context);
    console.log('📝 Extracted keywords:', keywords);

    if (keywords.length === 0) {
      console.log('⚠️ No keywords found, performing broad search...');
      // If no keywords, try a broad search for any articles
      const { data: broadArticles, error: broadError } = await supabase
        .from('knowledge_articles')
        .select(`
          id,
          title,
          slug,
          summary,
          content,
          tags,
          reference_code,
          category:knowledge_categories(name)
        `)
        .eq('status', 'published')
        .limit(3);

      if (broadError) {
        console.error('❌ Broad search error:', broadError);
        return { articles: [], tagToArticleMap: {} };
      }

      if (broadArticles && broadArticles.length > 0) {
        console.log(`✅ Broad search found ${broadArticles.length} articles`);
        const formattedArticles = formatArticleResults(broadArticles);
        const tagMapping = createTagToArticleMapping(formattedArticles, keywords);
        return { articles: formattedArticles, tagToArticleMap: tagMapping };
      }

      return { articles: [], tagToArticleMap: {} };
    }

    // Build search patterns for different approaches
    const searchQueries = [];
    
    // 1. Title and content text search
    keywords.forEach(keyword => {
      searchQueries.push(`title.ilike.%${keyword}%`);
      searchQueries.push(`content.ilike.%${keyword}%`);
      searchQueries.push(`summary.ilike.%${keyword}%`);
    });

    // 2. Tags array search
    const tagSearches = keywords.map(keyword => `tags.cs.{${keyword}}`);
    
    // 3. Reference code search
    const refSearches = keywords.map(keyword => `reference_code.ilike.%${keyword}%`);

    // Combine all search patterns
    const allSearches = [...searchQueries, ...tagSearches, ...refSearches];
    const searchQuery = allSearches.join(',');

    console.log(`🔎 Executing search with query patterns: ${searchQuery.substring(0, 200)}...`);

    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select(`
        id,
        title,
        slug,
        summary,
        content,
        tags,
        reference_code,
        category:knowledge_categories(name)
      `)
      .eq('status', 'published')
      .or(searchQuery)
      .limit(10);

    if (error) {
      console.error('❌ Knowledge search error:', error);
      return { articles: [], tagToArticleMap: {} };
    }

    if (!articles || articles.length === 0) {
      console.log('📭 No articles found with keyword search');
      return { articles: [], tagToArticleMap: {} };
    }

    console.log(`✅ Found ${articles.length} relevant articles`);

    // Enhanced formatting with relevance scoring
    const results = articles.map(article => {
      try {
        const categoryName = getCategoryName(article.category);
        const tagsList = getTagsList(article.tags);
        const relevanceScore = calculateRelevanceScore(message, article, keywords);

        return {
          title: String(article.title || 'Uten tittel'),
          summary: String(article.summary || ''),
          slug: String(article.slug || ''),
          category: categoryName,
          tags: tagsList,
          reference_code: String(article.reference_code || ''),
          relevanceScore
        };
      } catch (error) {
        console.error('❌ Error formatting article:', article?.id || 'unknown', error);
        return {
          title: 'Feil ved innlasting',
          summary: '',
          slug: '',
          category: 'Ukategoriseret',
          tags: [],
          reference_code: '',
          relevanceScore: 0
        };
      }
    }).filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Create tag-to-article mapping
    const tagMapping = createTagToArticleMapping(results, keywords);

    console.log(`📊 Returning ${results.length} scored and sorted articles with tag mappings`);
    return { articles: results, tagToArticleMap: tagMapping };

  } catch (error) {
    console.error('💥 Knowledge search failed:', error);
    return { articles: [], tagToArticleMap: {} };
  }
}

function formatArticleResults(articles: any[]): KnowledgeSearchResult[] {
  return articles.map(article => ({
    title: String(article.title || 'Uten tittel'),
    summary: String(article.summary || ''),
    slug: String(article.slug || ''),
    category: getCategoryName(article.category),
    tags: getTagsList(article.tags),
    reference_code: String(article.reference_code || ''),
    relevanceScore: 1
  }));
}

function createTagToArticleMapping(articles: KnowledgeSearchResult[], keywords: string[]): Record<string, ArticleTagMapping> {
  const mapping: Record<string, ArticleTagMapping> = {};
  
  // For each keyword/tag, find the best matching article
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    let bestMatch: KnowledgeSearchResult | null = null;
    let bestScore = 0;
    
    articles.forEach(article => {
      let score = 0;
      
      // Check title match
      if (article.title.toLowerCase().includes(keywordLower)) {
        score += 5;
      }
      
      // Check if any article tags match this keyword
      const matchingTags = article.tags.filter(tag => 
        tag.toLowerCase().includes(keywordLower) || keywordLower.includes(tag.toLowerCase())
      );
      score += matchingTags.length * 3;
      
      // Check reference code match
      if (article.reference_code.toLowerCase().includes(keywordLower)) {
        score += 4;
      }
      
      // Check category match
      if (article.category.toLowerCase().includes(keywordLower)) {
        score += 2;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = article;
      }
    });
    
    if (bestMatch && bestScore > 0) {
      mapping[keyword] = {
        articleSlug: bestMatch.slug,
        articleTitle: bestMatch.title,
        matchedTags: bestMatch.tags.filter(tag => 
          tag.toLowerCase().includes(keywordLower) || keywordLower.includes(tag.toLowerCase())
        ),
        relevanceScore: bestScore
      };
    }
  });
  
  // Also create mappings for common revision terms to the most relevant articles
  const commonTerms = ['revisjon', 'risikovurdering', 'vesentlighet', 'kontroll', 'dokumentasjon'];
  commonTerms.forEach(term => {
    if (!mapping[term] && articles.length > 0) {
      // Find article with highest overall relevance for this term
      const bestArticle = articles.find(article => 
        article.title.toLowerCase().includes(term) || 
        article.tags.some(tag => tag.toLowerCase().includes(term))
      ) || articles[0]; // Fallback to first article
      
      if (bestArticle) {
        mapping[term] = {
          articleSlug: bestArticle.slug,
          articleTitle: bestArticle.title,
          matchedTags: bestArticle.tags.filter(tag => tag.toLowerCase().includes(term)),
          relevanceScore: 1
        };
      }
    }
  });
  
  return mapping;
}

function getCategoryName(category: any): string {
  if (category && typeof category === 'object' && 'name' in category) {
    return String(category.name);
  }
  return 'Ukategoriseret';
}

function getTagsList(tags: any): string[] {
  if (tags && Array.isArray(tags)) {
    return tags.filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0);
  }
  return [];
}

function calculateRelevanceScore(message: string, article: any, keywords: string[]): number {
  try {
    const messageLower = message.toLowerCase();
    let score = 0;
    
    // Title match (high weight)
    if (article.title) {
      keywords.forEach(keyword => {
        if (article.title.toLowerCase().includes(keyword.toLowerCase())) {
          score += 5;
        }
      });
    }
    
    // Tags match (medium weight)
    if (Array.isArray(article.tags)) {
      const matchingTags = article.tags.filter((tag: string) => 
        tag && keywords.some(keyword => 
          tag.toLowerCase().includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(tag.toLowerCase())
        )
      );
      score += matchingTags.length * 3;
    }
    
    // Reference code match (very high weight)
    if (article.reference_code) {
      keywords.forEach(keyword => {
        if (article.reference_code.toLowerCase().includes(keyword.toLowerCase())) {
          score += 8;
        }
      });
    }
    
    // Content match (low weight, but broad)
    if (article.content && typeof article.content === 'string') {
      keywords.forEach(keyword => {
        if (article.content.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
    }
    
    // Summary match (medium weight)
    if (article.summary && typeof article.summary === 'string') {
      keywords.forEach(keyword => {
        if (article.summary.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2;
        }
      });
    }
    
    return score;
  } catch (error) {
    console.error('❌ Error calculating relevance score:', error);
    return 0;
  }
}
