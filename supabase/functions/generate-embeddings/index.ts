
import "../xhr.ts";
import { serve } from "../test_deps.ts";
import { createClient } from '../test_deps.ts';
import { log } from "../_shared/log.ts";
import { getUserFromRequest, hasPermittedRole } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSupabase(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } }
  });
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' ').substring(0, 8000), // Limit input length
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = getUserFromRequest(req);
    const permittedRoles = ['admin', 'partner', 'manager', 'employee'];
    if (!hasPermittedRole(user, permittedRoles)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = getSupabase(req);
    let requestBody = {};
    
    // Try to parse JSON body, but handle empty requests gracefully
    try {
      const text = await req.text();
      if (text && text.trim()) {
        requestBody = JSON.parse(text);
      }
    } catch (parseError) {
      log('No JSON body provided, proceeding with batch processing');
    }
    
    const { article_id } = requestBody as { article_id?: string };
    
    if (article_id) {
      // Handle single article embedding from trigger
      log(`🚀 Generating embedding for article: ${article_id}`);
      
      const { data: article, error: fetchError } = await supabase
        .from('knowledge_articles')
        .select('id, title, content')
        .eq('id', article_id)
        .eq('status', 'published')
        .single();

      if (fetchError || !article) {
        console.error('Article not found:', fetchError);
        return new Response(JSON.stringify({ error: 'Article not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate embedding for this article
      const textForEmbedding = `${article.title}\n\n${article.content}`;
      const embedding = await generateEmbedding(textForEmbedding);
      
      // Update article with embedding
      const { error: updateError } = await supabase
        .from('knowledge_articles')
        .update({ embedding })
        .eq('id', article.id);

      if (updateError) {
        console.error(`❌ Error updating article ${article.id}:`, updateError);
        throw updateError;
      }

      log(`✅ Updated embedding for: "${article.title}"`);
      
      return new Response(JSON.stringify({ 
        success: true,
        article_id,
        message: 'Embedding generated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Batch processing (existing functionality)
    log('🚀 Starting embedding generation for articles');

    // Get articles that need embeddings
    const { data: articles, error: fetchError } = await supabase.rpc('queue_articles_for_embedding');
    
    if (fetchError) {
      console.error('Error fetching articles:', fetchError);
      throw fetchError;
    }

    if (!articles || articles.length === 0) {
      log('✅ No articles need embeddings');
      return new Response(JSON.stringify({ 
        message: 'No articles need embeddings', 
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log(`📄 Found ${articles.length} articles needing embeddings`);

    let processed = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        // Combine title and content for embedding
        const textForEmbedding = `${article.title}\n\n${article.content}`;
        
        log(`🔄 Processing: "${article.title}"`);
        
        // Generate embedding
        const embedding = await generateEmbedding(textForEmbedding);
        
        // Update article with embedding
        const { error: updateError } = await supabase
          .from('knowledge_articles')
          .update({ embedding })
          .eq('id', article.id);

        if (updateError) {
          console.error(`❌ Error updating article ${article.id}:`, updateError);
          errors++;
        } else {
          processed++;
          log(`✅ Updated: "${article.title}"`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing article ${article.id}:`, error);
        errors++;
      }
    }

    log(`🎉 Embedding generation complete. Processed: ${processed}, Errors: ${errors}`);

    return new Response(JSON.stringify({ 
      message: 'Embedding generation complete',
      processed,
      errors,
      total: articles.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in generate-embeddings function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to generate embeddings'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
