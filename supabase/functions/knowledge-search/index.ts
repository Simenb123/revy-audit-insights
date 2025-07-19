
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../../src/integrations/supabase/types.ts';

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

function getSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://fxelhfwaoizqyecikscu.supabase.co';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc';
  
  console.log('🔐 Initializing Supabase client with URL:', supabaseUrl.substring(0, 30) + '...');
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  });
}

async function getEmbedding(text: string, openAIApiKey: string) {
  try {
    console.log('🔄 Getting embedding for text:', text.substring(0, 50) + '...');
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
    console.log('✅ Embedding generated successfully');
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

async function keywordSearch(supabase: any, query: string): Promise<SearchArticle[]> {
  console.log('🔎 Enhanced keyword search for:', query);

  const words = sanitizeWords(query);
  console.log('📝 Search words:', words);
  
  if (words.length === 0) {
    console.log('⚠️ No valid search words found');
    return [];
  }
  
  try {
    const titleConditions = words.map(word => `title.ilike.%${word}%`).join(',');
    const summaryConditions = words.map(word => `summary.ilike.%${word}%`).join(',');
    const contentConditions = words.map(word => `content.ilike.%${word}%`).join(',');
    const refConditions = words.map(word => `reference_code.ilike.%${word}%`).join(',');
    
    const searchConditions = [titleConditions, summaryConditions, contentConditions, refConditions].join(',');
    
    console.log('📊 Executing database query...');
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
    
    console.log(`✅ Keyword search found ${data?.length || 0} articles`);

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
    }).sort((a: SearchArticle, b: SearchArticle) => (b.similarity || 0) - (a.similarity || 0));
    
  } catch (error) {
    console.error('❌ Keyword search error:', error);
    throw error;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Knowledge search function started');
    
    let requestBody: KnowledgeSearchRequest;
    try {
      const bodyText = await req.text();
      console.log('📝 Raw request body length:', bodyText?.length || 0);
      
      if (!bodyText || bodyText.trim() === '') {
        console.log('⚠️ Empty request body received, using fallback');
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
      console.log('⚠️ No query parameter provided');
      return new Response(JSON.stringify({
        articles: [],
        tagMapping: {},
        message: 'Empty query'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Knowledge search for query:', query.substring(0, 50) + '...');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = getSupabaseClient(req);

    console.log('📊 Checking total published articles...');
    const { count: totalCount, error: countError } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (countError) {
      console.error('❌ Error checking article count:', countError);
      throw countError;
    }
    
    console.log(`📈 Total published articles: ${totalCount || 0}`);
    
    if (!totalCount || totalCount === 0) {
      console.log('⚠️ No published articles found');
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
        console.log('🧠 Attempting semantic search...');
        const queryEmbedding = await getEmbedding(query, openAIApiKey);
        
        console.log('🔍 Calling match_knowledge_articles RPC...');
        const { data, error } = await supabase.rpc('match_knowledge_articles', {
          p_query_embedding: queryEmbedding,
          p_match_threshold: 0.7,
          p_match_count: 10,
        });

        if (error) {
          console.error('❌ Semantic search RPC error:', error);
        } else {
          semanticResults = data || [];
          console.log(`✅ Semantic search found ${semanticResults.length} articles`);
        }
      } catch (e) {
        console.error("❌ Error during semantic search:", e.message);
      }
    } else {
      console.log('⚠️ No OpenAI API key, skipping semantic search');
    }
    
    console.log('🔤 Performing keyword search...');
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
    
    console.log(`✅ Returning ${finalResults.length} unique search results`);

    return new Response(JSON.stringify({
      articles: finalResults,
      tagMapping: {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Critical error in knowledge-search function:', error);
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

Deno.serve(handler);
