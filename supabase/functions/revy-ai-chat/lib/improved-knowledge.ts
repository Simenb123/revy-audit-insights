import { supabase } from './supabase.ts';
import { extractIntelligentKeywords as extractKeywords } from './utils.ts';

interface KnowledgeSearchResult {
  title: string;
  summary: string;
  slug: string;
  category: string;
  tags: string[];
  reference_code: string;
  relevanceScore: number;
}

export async function searchKnowledgeIntelligently(
  message: string, 
  context: string, 
  clientData?: any
): Promise<KnowledgeSearchResult[]> {
  try {
    console.log('🔍 Starting intelligent knowledge search...');
    
    // Extract keywords from the message
    const keywords = extractKeywords(message);
    console.log('📝 Extracted keywords:', keywords);

    if (keywords.length === 0) {
      console.log('⚠️ No keywords found, returning empty results');
      return [];
    }

    // Search using text similarity and tags
    const searchQuery = keywords.join(' | ');
    
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
      .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,tags.cs.{${keywords.join(',')}}`)
      .limit(5);

    if (error) {
      console.error('❌ Knowledge search error:', error);
      return [];
    }

    if (!articles || articles.length === 0) {
      console.log('📭 No articles found');
      return [];
    }

    console.log(`✅ Found ${articles.length} relevant articles`);

    // Enhanced formatting with tags
    return articles.map(article => ({
      title: article.title,
      summary: article.summary || '',
      slug: article.slug,
      category: article.category?.name || 'Ukategorisert',
      tags: article.tags || [],
      reference_code: article.reference_code || '',
      relevanceScore: calculateRelevanceScore(message, article)
    }));

  } catch (error) {
    console.error('💥 Knowledge search failed:', error);
    return [];
  }
}

function calculateRelevanceScore(message: string, article: any): number {
  const messageLower = message.toLowerCase();
  let score = 0;
  
  // Title match
  if (article.title?.toLowerCase().includes(messageLower)) {
    score += 3;
  }
  
  // Tags match
  if (article.tags) {
    const matchingTags = article.tags.filter((tag: string) => 
      messageLower.includes(tag.toLowerCase()) || 
      tag.toLowerCase().includes(messageLower)
    );
    score += matchingTags.length * 2;
  }
  
  // Reference code match
  if (article.reference_code && messageLower.includes(article.reference_code.toLowerCase())) {
    score += 4;
  }
  
  // Content match (basic)
  if (article.content?.toLowerCase().includes(messageLower)) {
    score += 1;
  }
  
  return score;
}
