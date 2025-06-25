
import { supabase } from './supabase.ts';
import { extractIntelligentKeywords } from './utils.ts';
import { log } from '../_shared/log.ts';

interface KnowledgeSearchResult {
  title: string;
  summary: string;
  slug: string;
  category: string;
  tags: string[];
  reference_code: string;
  relevanceScore: number;
  contentType: string;
}

interface ArticleTagMapping {
  articleSlug: string;
  articleTitle: string;
  matchedTags: string[];
  relevanceScore: number;
  contentType: string;
  category: string;
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
    log('🔍 Starting intelligent knowledge search with enhanced content type support...');
    log(`📝 Message: "${message}"`);
    log(`🎯 Context: "${context}"`);
    
    // First check if we have any published articles at all
    const { count: totalCount, error: countError } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (countError) {
      console.error('❌ Error checking article count:', countError);
      return { articles: [], tagToArticleMap: {} };
    }
    
    log(`📊 Total published articles available: ${totalCount || 0}`);
    
    if (!totalCount || totalCount === 0) {
      log('❌ No published articles found in database');
      return { articles: [], tagToArticleMap: {} };
    }

    // Extract keywords from the message
    const keywords = extractIntelligentKeywords(message, context);
    log('📝 Extracted keywords:', keywords);

    if (keywords.length === 0) {
      log('⚠️ No keywords found, performing broad search...');
      // If no keywords, try a broad search for any articles
      const { data: broadArticles, error: broadError } = await supabase
        .from('knowledge_articles')
        .select(`
          id,
          title,
          slug,
          summary,
          content,
          reference_code,
          content_type,
          category:knowledge_categories(name),
          article_tags:knowledge_article_tags(
            tag:tags(
              name,
              display_name
            )
          )
        `)
        .eq('status', 'published')
        .limit(3);

      if (broadError) {
        console.error('❌ Broad search error:', broadError);
        return { articles: [], tagToArticleMap: {} };
      }

      if (broadArticles && broadArticles.length > 0) {
        log(`✅ Broad search found ${broadArticles.length} articles`);
        const formattedArticles = formatArticleResults(broadArticles);
        const tagMapping = createEnhancedTagToArticleMapping(formattedArticles, keywords);
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
      searchQueries.push(`slug.ilike.%${keyword}%`);
    });

    // 2. Reference code search
    const refSearches = keywords.map(keyword => `reference_code.ilike.%${keyword}%`);

    // Combine all search patterns (no more direct tags search)
    const allSearches = [...searchQueries, ...refSearches];
    const searchQuery = allSearches.join(',');

    log(`🔎 Executing enhanced search with query patterns: ${searchQuery.substring(0, 200)}...`);

    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select(`
        id,
        title,
        slug,
        summary,
        content,
        reference_code,
        content_type,
        category:knowledge_categories(name),
        article_tags:knowledge_article_tags(
          tag:tags(
            name,
            display_name
          )
        )
      `)
      .eq('status', 'published')
      .or(searchQuery)
      .limit(15);

    if (error) {
      console.error('❌ Knowledge search error:', error);
      return { articles: [], tagToArticleMap: {} };
    }

    if (!articles || articles.length === 0) {
      log('📭 No articles found with keyword search');
      return { articles: [], tagToArticleMap: {} };
    }

    log(`✅ Found ${articles.length} relevant articles`);

    // Enhanced formatting with relevance scoring and content type classification
    const results = articles.map(article => {
      try {
        const categoryName = getCategoryName(article.category);
        const tagsList = getTagsList(article.article_tags);
        const relevanceScore = calculateRelevanceScore(message, article, keywords);
        const contentType = article.content_type || classifyContentType(article, categoryName);

        // Create summary from content if missing
        let summary = String(article.summary || '');
        if (!summary && article.content) {
          const contentText = String(article.content);
          const sentences = contentText.replace(/<[^>]*>/g, '').split(/[.!?]+/);
          summary = sentences.slice(0, 2).join('. ').substring(0, 200) + '...';
          log(`📝 Generated summary for article "${article.title}": ${summary.substring(0, 50)}...`);
        }

        return {
          title: String(article.title || 'Uten tittel'),
          summary,
          slug: String(article.slug || ''),
          category: categoryName,
          tags: tagsList,
          reference_code: String(article.reference_code || ''),
          relevanceScore,
          contentType
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
          relevanceScore: 0,
          contentType: 'fagartikkel'
        };
      }
    }).filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Create enhanced tag-to-article mapping with content types
    const tagMapping = createEnhancedTagToArticleMapping(results, keywords);

    log(`📊 Returning ${results.length} scored and sorted articles with enhanced content type support`);
    return { articles: results, tagToArticleMap: tagMapping };

  } catch (error) {
    console.error('💥 Knowledge search failed:', error);
    return { articles: [], tagToArticleMap: {} };
  }
}

function classifyContentType(article: any, categoryName: string): string {
  const title = String(article.title || '').toLowerCase();
  const refCode = String(article.reference_code || '').toLowerCase();
  const category = categoryName.toLowerCase();
  
  // Enhanced content type classification
  if (refCode.includes('isa') || title.includes('isa ') || /isa\s+\d+/.test(title) || 
      category.includes('isa') || title.includes('international standards on auditing')) {
    return 'isa-standard';
  }
  
  if (refCode.includes('nrs') || title.includes('nrs ') || /nrs\s+\d+/.test(title) || 
      category.includes('nrs') || title.includes('norsk revisjonsstandard')) {
    return 'nrs-standard';
  }
  
  if (title.includes('lov') || title.includes('loven') || category.includes('lov') || 
      title.includes('lovbestemmelse') || category.includes('lover')) {
    return 'lov';
  }
  
  if (title.includes('forskrift') || category.includes('forskrift') || 
      title.includes('reglement') || category.includes('forskrifter')) {
    return 'forskrift';
  }
  
  if (title.includes('forarbeider') || title.includes('innstilling') || 
      title.includes('proposisjon') || category.includes('forarbeider') ||
      title.includes('stortingsmelding')) {
    return 'forarbeider';
  }
  
  // Default to fagartikkel
  return 'fagartikkel';
}

function formatArticleResults(articles: any[]): KnowledgeSearchResult[] {
  return articles.map(article => {
    // Create summary from content if missing
    let summary = String(article.summary || '');
    if (!summary && article.content) {
      const contentText = String(article.content);
      const sentences = contentText.replace(/<[^>]*>/g, '').split(/[.!?]+/);
      summary = sentences.slice(0, 2).join('. ').substring(0, 200) + '...';
    }
    
    const categoryName = getCategoryName(article.category);
    const contentType = article.content_type || classifyContentType(article, categoryName);
    
    return {
      title: String(article.title || 'Uten tittel'),
      summary,
      slug: String(article.slug || ''),
      category: categoryName,
      tags: getTagsList(article.article_tags),
      reference_code: String(article.reference_code || ''),
      relevanceScore: 1,
      contentType
    };
  });
}

function createEnhancedTagToArticleMapping(articles: KnowledgeSearchResult[], keywords: string[]): Record<string, ArticleTagMapping> {
  const mapping: Record<string, ArticleTagMapping> = {};
  
  // For each keyword/tag, find the best matching article
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    let bestMatch: KnowledgeSearchResult | null = null;
    let bestScore = 0;
    
    articles.forEach(article => {
      let score = 0;
      
      // Check title match (high priority)
      if (article.title.toLowerCase().includes(keywordLower)) {
        score += 5;
      }
      
      // Check slug match (medium-high priority for URLs)
      if (article.slug.toLowerCase().includes(keywordLower)) {
        score += 4;
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
      
      // Check summary/content match (lower priority but still relevant)
      if (article.summary && article.summary.toLowerCase().includes(keywordLower)) {
        score += 1;
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
        relevanceScore: bestScore,
        contentType: bestMatch.contentType,
        category: bestMatch.category
      };
    }
  });
  
  // Also create mappings for common terms with enhanced content type awareness
  const commonTerms = ['skattemelding', 'skatt', 'avgift', 'mva', 'regnskap', 'revisjon', 'dokumentasjon', 'isa', 'nrs'];
  commonTerms.forEach(term => {
    if (!mapping[term] && articles.length > 0) {
      // Find article with highest relevance for this term
      const bestArticle = articles.find(article => 
        article.title.toLowerCase().includes(term) || 
        article.slug.toLowerCase().includes(term) ||
        article.tags.some(tag => tag.toLowerCase().includes(term)) ||
        (article.summary && article.summary.toLowerCase().includes(term)) ||
        article.contentType.includes(term)
      ) || articles[0]; // Fallback to first article
      
      if (bestArticle) {
        mapping[term] = {
          articleSlug: bestArticle.slug,
          articleTitle: bestArticle.title,
          matchedTags: bestArticle.tags.filter(tag => tag.toLowerCase().includes(term)),
          relevanceScore: 1,
          contentType: bestArticle.contentType,
          category: bestArticle.category
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

function getTagsList(articleTags: any): string[] {
  if (articleTags && Array.isArray(articleTags)) {
    return articleTags
      .map(tagRelation => tagRelation.tag?.name || tagRelation.tag?.display_name)
      .filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0);
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
    
    // Slug match (high weight for URL-based matching)
    if (article.slug) {
      keywords.forEach(keyword => {
        if (article.slug.toLowerCase().includes(keyword.toLowerCase())) {
          score += 4;
        }
      });
    }
    
    // Tags match (medium weight) - now using proper structure
    if (Array.isArray(article.article_tags)) {
      const matchingTags = article.article_tags.filter((tagRelation: any) => 
        tagRelation.tag && keywords.some(keyword => {
          const tagName = tagRelation.tag.name?.toLowerCase() || '';
          const tagDisplayName = tagRelation.tag.display_name?.toLowerCase() || '';
          return tagName.includes(keyword.toLowerCase()) || 
                 tagDisplayName.includes(keyword.toLowerCase()) ||
                 keyword.toLowerCase().includes(tagName) ||
                 keyword.toLowerCase().includes(tagDisplayName);
        })
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
    
    // Content type match (medium weight)
    if (article.content_type) {
      keywords.forEach(keyword => {
        if (article.content_type.toLowerCase().includes(keyword.toLowerCase())) {
          score += 3;
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
