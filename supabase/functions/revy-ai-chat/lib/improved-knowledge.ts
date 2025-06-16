
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

    // Enhanced formatting with safe data handling
    return articles.map(article => {
      try {
        return {
          title: article.title || 'Uten tittel',
          summary: article.summary || '',
          slug: article.slug || '',
          category: article.category?.name || 'Ukategorisert',
          tags: Array.isArray(article.tags) ? article.tags : [],
          reference_code: article.reference_code || '',
          relevanceScore: calculateRelevanceScore(message, article)
        };
      } catch (error) {
        console.error('❌ Error formatting article:', article.id, error);
        return {
          title: 'Feil ved innlasting',
          summary: '',
          slug: '',
          category: 'Ukategorisert',
          tags: [],
          reference_code: '',
          relevanceScore: 0
        };
      }
    }).filter(result => result.relevanceScore > 0);

  } catch (error) {
    console.error('💥 Knowledge search failed:', error);
    return [];
  }
}

function calculateRelevanceScore(message: string, article: any): number {
  try {
    const messageLower = message.toLowerCase();
    let score = 0;
    
    // Title match
    if (article.title && article.title.toLowerCase().includes(messageLower)) {
      score += 3;
    }
    
    // Tags match
    if (Array.isArray(article.tags)) {
      const matchingTags = article.tags.filter((tag: string) => 
        tag && (
          messageLower.includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(messageLower)
        )
      );
      score += matchingTags.length * 2;
    }
    
    // Reference code match
    if (article.reference_code && messageLower.includes(article.reference_code.toLowerCase())) {
      score += 4;
    }
    
    // Content match (basic, with safety check)
    if (article.content && typeof article.content === 'string' && article.content.toLowerCase().includes(messageLower)) {
      score += 1;
    }
    
    return score;
  } catch (error) {
    console.error('❌ Error calculating relevance score:', error);
    return 0;
  }
}
