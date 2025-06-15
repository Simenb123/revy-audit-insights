
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
    console.log('🚀 Starting embedding generation for articles');

    // Get articles that need embeddings
    const { data: articles, error: fetchError } = await supabase.rpc('queue_articles_for_embedding');
    
    if (fetchError) {
      console.error('Error fetching articles:', fetchError);
      throw fetchError;
    }

    if (!articles || articles.length === 0) {
      console.log('✅ No articles need embeddings');
      return new Response(JSON.stringify({ 
        message: 'No articles need embeddings', 
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📄 Found ${articles.length} articles needing embeddings`);

    let processed = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        // Combine title and content for embedding
        const textForEmbedding = `${article.title}\n\n${article.content}`;
        
        console.log(`🔄 Processing: "${article.title}"`);
        
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
          console.log(`✅ Updated: "${article.title}"`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing article ${article.id}:`, error);
        errors++;
      }
    }

    console.log(`🎉 Embedding generation complete. Processed: ${processed}, Errors: ${errors}`);

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
