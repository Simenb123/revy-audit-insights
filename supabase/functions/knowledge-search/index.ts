
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getEmbedding(text: string, openAIApiKey: string) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text.replace(/\n/g, ' ') }),
  });
  if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI embedding error:", errorBody);
      throw new Error('Failed to get embedding from OpenAI');
  }
  const data = await response.json();
  return data.data[0].embedding;
}

async function keywordSearch(supabase: any, query: string) {
  console.log('🔎 Enhanced keyword search for:', query);
  
  // Split query into individual words and filter out short words
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
  console.log('📝 Search words:', words);
  
  if (words.length === 0) {
    return [];
  }
  
  // Build search conditions for multiple words
  const titleConditions = words.map(word => `title.ilike.%${word}%`).join(',');
  const summaryConditions = words.map(word => `summary.ilike.%${word}%`).join(',');
  const contentConditions = words.map(word => `content.ilike.%${word}%`).join(',');
  const tagConditions = words.map(word => `tags.cs.{${word}}`).join(',');
  const refConditions = words.map(word => `reference_code.ilike.%${word}%`).join(',');
  
  // Combine all search conditions
  const searchConditions = [
    titleConditions,
    summaryConditions, 
    contentConditions,
    tagConditions,
    refConditions
  ].join(',');
  
  console.log('🔍 Search conditions:', searchConditions.substring(0, 200) + '...');
  
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*, category:knowledge_categories(name, id)')
    .eq('status', 'published')
    .or(searchConditions)
    .order('view_count', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error('❌ Keyword search error:', error);
    throw error;
  }
  
  console.log(`✅ Keyword search found ${data?.length || 0} articles`);
  
  // Calculate relevance score based on word matches
  return (data || []).map((article: any) => {
    let relevanceScore = 0;
    const titleLower = (article.title || '').toLowerCase();
    const summaryLower = (article.summary || '').toLowerCase();
    const contentLower = (article.content || '').toLowerCase();
    const refCodeLower = (article.reference_code || '').toLowerCase();
    
    // Score based on matches in different fields
    words.forEach(word => {
      if (titleLower.includes(word)) relevanceScore += 5;
      if (refCodeLower.includes(word)) relevanceScore += 4;
      if (summaryLower.includes(word)) relevanceScore += 2;
      if (contentLower.includes(word)) relevanceScore += 1;
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(word)) relevanceScore += 3;
        });
      }
    });
    
    return { 
      ...article, 
      similarity: relevanceScore / 10, // Normalize score 
      category: article.category ? { name: article.category.name } : null 
    };
  }).sort((a: any, b: any) => b.similarity - a.similarity);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query) throw new Error('Query parameter is required');

    console.log('🔍 Knowledge search for:', query);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!openAIApiKey || !supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    let semanticResults = [];
    try {
        const queryEmbedding = await getEmbedding(query, openAIApiKey);
        const { data, error } = await supabase.rpc('match_knowledge_articles', {
          p_query_embedding: queryEmbedding,
          p_match_threshold: 0.7,
          p_match_count: 10,
        });

        if (error) {
          console.error('Semantic search RPC error:', error.message);
        } else {
            semanticResults = data;
        }
    } catch (e) {
        console.error("Error during semantic search part:", e.message);
    }
    
    const keywordResults = await keywordSearch(supabase, query);

    const combinedResults = [...(semanticResults || []), ...keywordResults];
    const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
    
    uniqueResults.sort((a, b) => {
        if (b.similarity !== a.similarity) {
            return b.similarity - a.similarity;
        }
        return (b.view_count || 0) - (a.view_count || 0);
    });

    console.log(`✅ Returning ${uniqueResults.length} unique search results`);

    return new Response(JSON.stringify(uniqueResults.slice(0, 20)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in knowledge-search function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
