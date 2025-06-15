
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
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*, category:knowledge_categories(name, id)')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,tags.cs.{${query}}`)
    .order('view_count', { ascending: false })
    .limit(20);
  if (error) throw error;
  // The category from the RPC call is JSON, let's match the structure
  return data.map((article: any) => ({ ...article, similarity: 0, category: article.category ? { name: article.category.name } : null }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query) throw new Error('Query parameter is required');

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
