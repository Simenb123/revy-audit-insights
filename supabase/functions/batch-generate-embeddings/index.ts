import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchEmbeddingRequest {
  entity_type: 'knowledge_articles' | 'legal_provisions' | 'legal_documents';
  batch_size?: number;
  specific_ids?: string[];
}

interface BatchEmbeddingResponse {
  success: boolean;
  processed: number;
  errors: number;
  message: string;
  failed_ids?: string[];
}

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Truncate text to avoid token limits (8000 chars ≈ 2000 tokens)
  const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: truncatedText,
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { entity_type, batch_size = 10, specific_ids }: BatchEmbeddingRequest = await req.json();

    let processed = 0;
    let errors = 0;
    const failed_ids: string[] = [];

    console.log(`Starting batch embedding generation for ${entity_type}, batch size: ${batch_size}`);

    if (entity_type === 'knowledge_articles') {
      let query = supabase
        .from('knowledge_articles')
        .select('id, title, content, summary')
        .eq('status', 'published')
        .is('embedding', null);

      if (specific_ids && specific_ids.length > 0) {
        query = query.in('id', specific_ids);
      }

      const { data: articles, error } = await query.limit(batch_size);
      
      if (error) throw error;

      for (const article of articles || []) {
        try {
          const combinedText = `${article.title}\n\n${article.summary || ''}\n\n${article.content || ''}`;
          const embedding = await generateEmbedding(combinedText);
          
          await supabase
            .from('knowledge_articles')
            .update({ embedding })
            .eq('id', article.id);
          
          processed++;
          console.log(`Generated embedding for article: ${article.title}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to generate embedding for article ${article.id}:`, error);
          errors++;
          failed_ids.push(article.id);
        }
      }
    }

    if (entity_type === 'legal_provisions') {
      let query = supabase
        .from('legal_provisions')
        .select('id, title, content, provision_number, law_identifier')
        .eq('is_active', true)
        .is('embedding', null);

      if (specific_ids && specific_ids.length > 0) {
        query = query.in('id', specific_ids);
      }

      const { data: provisions, error } = await query.limit(batch_size);
      
      if (error) throw error;

      for (const provision of provisions || []) {
        try {
          const combinedText = `${provision.law_identifier || ''} ${provision.provision_number || ''} ${provision.title || ''}\n\n${provision.content || ''}`;
          const embedding = await generateEmbedding(combinedText);
          
          await supabase
            .from('legal_provisions')
            .update({ embedding })
            .eq('id', provision.id);
          
          processed++;
          console.log(`Generated embedding for provision: ${provision.provision_number}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          console.error(`Failed to generate embedding for provision ${provision.id}:`, error);
          errors++;
          failed_ids.push(provision.id);
        }
      }
    }

    if (entity_type === 'legal_documents') {
      let query = supabase
        .from('legal_documents')
        .select('id, title, content, summary, document_number')
        .is('embedding', null);

      if (specific_ids && specific_ids.length > 0) {
        query = query.in('id', specific_ids);
      }

      const { data: documents, error } = await query.limit(batch_size);
      
      if (error) throw error;

      for (const document of documents || []) {
        try {
          const combinedText = `${document.document_number || ''} ${document.title || ''}\n\n${document.summary || ''}\n\n${document.content || ''}`;
          const embedding = await generateEmbedding(combinedText);
          
          await supabase
            .from('legal_documents')
            .update({ embedding })
            .eq('id', document.id);
          
          processed++;
          console.log(`Generated embedding for document: ${document.title}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to generate embedding for document ${document.id}:`, error);
          errors++;
          failed_ids.push(document.id);
        }
      }
    }

    const response: BatchEmbeddingResponse = {
      success: true,
      processed,
      errors,
      message: `Processed ${processed} ${entity_type}, ${errors} errors`,
      ...(failed_ids.length > 0 && { failed_ids })
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in batch-generate-embeddings function:', error);
    
    const response: BatchEmbeddingResponse = {
      success: false,
      processed: 0,
      errors: 1,
      message: `Error: ${error.message}`,
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});