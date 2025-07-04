
import "../xhr.ts";

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../../src/integrations/supabase/types.ts';
import { log } from "../_shared/log.ts";
import { getUserFromRequest, hasPermittedRole } from "../_shared/auth.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeSearchRequest {
  query: string;
}

interface SearchArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  reference_code: string | null;
  view_count: number | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  similarity?: number;
  category?: { name: string; id: string } | null;
}

interface TagMappingEntry {
  articleSlug: string;
  articleTitle: string;
  matchedTags: string[];
  relevanceScore: number;
  contentType: string;
  category: string;
  updated_at?: string;
  published_at?: string;
}

interface KnowledgeSearchResponse {
  articles: SearchArticle[];
  tagMapping: Record<string, TagMappingEntry>;
  message?: string;
  error?: string;
}

async function getEmbedding(text: string, openAIApiKey: string) {
  try {
    log('🔄 Getting embedding for text:', text.substring(0, 50) + '...');
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.replace(/\n/g, ' ') }),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("❌ OpenAI embedding error:", errorBody);
        throw new Error('Failed to get embedding from OpenAI');
    }
    const data = await response.json();
    log('✅ Embedding generated successfully');
    return data.data[0].embedding;
  } catch (error) {
    console.error('❌ Error getting embedding:', error);
    throw error;
  }
}

function sanitizeWords(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\såøæäöü]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.split(' ').filter(word => word.length > 1);
}

async function keywordSearch(
  supabase: SupabaseClient<Database>,
  query: string
): Promise<SearchArticle[]> {
  log('🔎 Enhanced keyword search for:', query);

  const words = sanitizeWords(query);
  log('📝 Search words:', words);
  
  if (words.length === 0) {
    log('⚠️ No valid search words found');
    return [];
  }
  
  try {
    const titleConditions = words.map(word => `title.ilike.%${word}%`).join(',');
    const summaryConditions = words.map(word => `summary.ilike.%${word}%`).join(',');
    const contentConditions = words.map(word => `content.ilike.%${word}%`).join(',');
    const refConditions = words.map(word => `reference_code.ilike.%${word}%`).join(',');
    
    const searchConditions = [titleConditions, summaryConditions, contentConditions, refConditions].join(',');
    
    log('📊 Executing database query...');
    const { data, error } = await supabase
      .from('knowledge_articles')
      .select(`
        id,
        title,
        slug,
        summary,
        content,
        reference_code,
        view_count,
        created_at,
        updated_at,
        published_at,
        category:knowledge_categories(name, id)
      `)
      .eq('status', 'published')
      .or(searchConditions)
      .order('view_count', { ascending: false })
      .limit(20);

    const typedData = data as SearchArticle[] | null;
      
    if (error) {
      console.error('❌ Keyword search database error:', error);
      throw error;
    }
    
    log(`✅ Keyword search found ${typedData?.length || 0} articles`);

    return (typedData || []).map((article: SearchArticle) => {
      let relevanceScore = 0;
      const titleLower = (article.title || '').toLowerCase();
      const summaryLower = (article.summary || '').toLowerCase();
      const contentLower = (article.content || '').toLowerCase();
      const refCodeLower = (article.reference_code || '').toLowerCase();
      
      words.forEach(word => {
        if (titleLower.includes(word)) relevanceScore += 5;
        if (refCodeLower.includes(word)) relevanceScore += 4;
        if (summaryLower.includes(word)) relevanceScore += 2;
        if (contentLower.includes(word)) relevanceScore += 1;
      });
      
      return { 
        ...article, 
        similarity: Math.min(relevanceScore / 10, 1.0),
        category: article.category ? { name: article.category.name } : null 
      };
    }).sort((a: SearchArticle, b: SearchArticle) => (b.similarity || 0) - (a.similarity || 0));
    
  } catch (error) {
    console.error('❌ Keyword search error:', error);
    throw error;
  }
}

function createTagMapping(
  articles: SearchArticle[],
  keywords: string[]
): Record<string, TagMappingEntry> {
  const mapping: Record<string, TagMappingEntry> = {};
  
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    
    articles.forEach(article => {
      let score = 0;
      
      if (article.title && article.title.toLowerCase().includes(keywordLower)) score += 5;
      if (article.reference_code && article.reference_code.toLowerCase().includes(keywordLower)) score += 4;
      if (article.summary && article.summary.toLowerCase().includes(keywordLower)) score += 2;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = article;
      }
    });
    
    if (bestMatch && bestScore > 0) {
      mapping[keyword] = {
        articleSlug: bestMatch.slug,
        articleTitle: bestMatch.title,
        matchedTags: [],
        relevanceScore: bestScore,
        contentType: 'fagartikkel',
        category: bestMatch.category?.name || 'Ukategoriseret',
        updated_at: bestMatch.updated_at,
        published_at: bestMatch.published_at
      };
    }
  });
  
  return mapping;
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = getUserFromRequest(req);
    const permittedRoles = ['admin', 'partner', 'manager', 'employee'];
    if (!hasPermittedRole(user, permittedRoles)) {
      log('❌ Unauthorized request', { userId: user?.sub, role: user?.user_role || user?.role });
      return new Response(JSON.stringify({ articles: [], tagMapping: {}, error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('🚀 Knowledge search function started for user', user?.sub?.slice(0, 8));
    
    // Improved JSON parsing with better error handling
    let requestBody: KnowledgeSearchRequest;
    try {
      const bodyText = await req.text();
      log('📝 Raw request body length:', bodyText?.length || 0);
      
      if (!bodyText || bodyText.trim() === '') {
        log('⚠️ Empty request body received, using fallback');
        // Return empty results instead of throwing error
        return new Response(JSON.stringify({
          articles: [],
          tagMapping: {},
          message: 'No query provided'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      requestBody = JSON.parse(bodyText) as KnowledgeSearchRequest;
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query } = requestBody;
    if (!query || query.trim() === '') {
      log('⚠️ No query parameter provided');
      return new Response(JSON.stringify({
        articles: [],
        tagMapping: {},
        message: 'Empty query'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('🔍 Knowledge search for query:', query.substring(0, 50) + '...');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    log('🔗 Creating Supabase client...');
    const supabase: SupabaseClient<Database> = getSupabase(req) as SupabaseClient<Database>;

    log('📊 Checking total published articles...');
    const { count: totalCount, error: countError } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (countError) {
      console.error('❌ Error checking article count:', countError);
      throw countError;
    }
    
    log(`📈 Total published articles: ${totalCount || 0}`);
    
    if (!totalCount || totalCount === 0) {
      log('⚠️ No published articles found');
      return new Response(JSON.stringify({
        articles: [],
        tagMapping: {}
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let semanticResults = [];
    
    if (openAIApiKey) {
      try {
        log('🧠 Attempting semantic search...');
        const queryEmbedding = await getEmbedding(query, openAIApiKey);
        
        log('🔍 Calling match_knowledge_articles RPC...');
        const { data, error } = await supabase.rpc('match_knowledge_articles', {
          p_query_embedding: queryEmbedding,
          p_match_threshold: 0.7,
          p_match_count: 10,
        });

        if (error) {
          console.error('❌ Semantic search RPC error:', error);
        } else {
            semanticResults = data || [];
            log(`✅ Semantic search found ${semanticResults.length} articles`);
        }
      } catch (e) {
        console.error("❌ Error during semantic search:", e.message);
      }
    } else {
      log('⚠️ No OpenAI API key, skipping semantic search');
    }
    
    log('🔤 Performing keyword search...');
    const keywordResults = await keywordSearch(supabase, query);

    const combinedResults = [...(semanticResults || []), ...keywordResults];
    const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
    
    uniqueResults.sort((a, b) => {
        if (b.similarity !== a.similarity) {
            return b.similarity - a.similarity;
        }
        return (b.view_count || 0) - (a.view_count || 0);
    });

    const finalResults = uniqueResults.slice(0, 20);
    
    const keywords = sanitizeWords(query);
    const tagMapping = createTagMapping(finalResults, keywords);
    
    log(`✅ Returning ${finalResults.length} unique search results with tag mappings`);

    return new Response(JSON.stringify({
      articles: finalResults,
      tagMapping: tagMapping
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Critical error in knowledge-search function:', error);
    // Return empty results instead of error to prevent breaking the AI chat
    return new Response(JSON.stringify({
      articles: [],
      tagMapping: {},
      error: 'Knowledge search temporarily unavailable'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

if (import.meta.main) {
  Deno.serve(handler);
}
