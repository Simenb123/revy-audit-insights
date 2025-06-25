
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { log } from "../_shared/log.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

async function keywordSearch(supabase: any, query: string) {
  log('🔎 Enhanced keyword search for:', query);
  
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
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
      
    if (error) {
      console.error('❌ Keyword search database error:', error);
      throw error;
    }
    
    log(`✅ Keyword search found ${data?.length || 0} articles`);
    
    return (data || []).map((article: any) => {
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
    }).sort((a: any, b: any) => b.similarity - a.similarity);
    
  } catch (error) {
    console.error('❌ Keyword search error:', error);
    throw error;
  }
}

function createTagMapping(articles: any[], keywords: string[]) {
  const mapping: Record<string, any> = {};
  
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('🚀 Knowledge search function started');
    
    // Improved JSON parsing with better error handling
    let requestBody;
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
      
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      // Return empty results for malformed JSON instead of error
      return new Response(JSON.stringify({ 
        articles: [],
        tagMapping: {},
        message: 'Invalid JSON format'
      }), {
        status: 200,
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    log('🔗 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

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
    
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
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
});
