import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface GenerateEmbeddingsRequest {
  document_id?: string;
  provision_id?: string;
  batch_size?: number;
}

interface GenerateEmbeddingsResponse {
  success: boolean;
  processed: number;
  errors: number;
  message: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000), // Limit to avoid token limits
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, provision_id, batch_size = 10 }: GenerateEmbeddingsRequest = await req.json() || {};
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting legal embeddings generation...');
    
    let processed = 0;
    let errors = 0;

    // Handle single document
    if (document_id) {
      try {
        const { data: document, error: fetchError } = await supabase
          .from('legal_documents')
          .select('id, title, content, summary')
          .eq('id', document_id)
          .eq('is_active', true)
          .single();

        if (fetchError || !document) {
          throw new Error('Document not found');
        }

        const textToEmbed = `${document.title}\n\n${document.summary || ''}\n\n${document.content || ''}`.trim();
        const embedding = await generateEmbedding(textToEmbed);

        const { error: updateError } = await supabase
          .from('legal_documents')
          .update({ embedding })
          .eq('id', document_id);

        if (updateError) {
          throw new Error(`Failed to update document: ${updateError.message}`);
        }

        processed = 1;
        console.log(`✅ Generated embedding for document: ${document.title}`);
      } catch (error) {
        console.error('Error processing document:', error);
        errors = 1;
      }
    }
    // Handle single provision
    else if (provision_id) {
      try {
        const { data: provision, error: fetchError } = await supabase
          .from('legal_provisions')
          .select('id, title, content, law_identifier, provision_number')
          .eq('id', provision_id)
          .eq('is_active', true)
          .single();

        if (fetchError || !provision) {
          throw new Error('Provision not found');
        }

        const textToEmbed = `${provision.law_identifier} § ${provision.provision_number}: ${provision.title}\n\n${provision.content || ''}`.trim();
        const embedding = await generateEmbedding(textToEmbed);

        const { error: updateError } = await supabase
          .from('legal_provisions')
          .update({ embedding })
          .eq('id', provision_id);

        if (updateError) {
          throw new Error(`Failed to update provision: ${updateError.message}`);
        }

        processed = 1;
        console.log(`✅ Generated embedding for provision: ${provision.law_identifier} § ${provision.provision_number}`);
      } catch (error) {
        console.error('Error processing provision:', error);
        errors = 1;
      }
    }
    // Handle batch processing
    else {
      // Process documents without embeddings
      const { data: documents, error: docError } = await supabase
        .from('legal_documents')
        .select('id, title, content, summary')
        .eq('is_active', true)
        .is('embedding', null)
        .limit(batch_size);

      if (!docError && documents && documents.length > 0) {
        console.log(`📄 Processing ${documents.length} documents...`);
        
        for (const doc of documents) {
          try {
            const textToEmbed = `${doc.title}\n\n${doc.summary || ''}\n\n${doc.content || ''}`.trim();
            const embedding = await generateEmbedding(textToEmbed);

            const { error: updateError } = await supabase
              .from('legal_documents')
              .update({ embedding })
              .eq('id', doc.id);

            if (updateError) {
              console.error(`Failed to update document ${doc.title}:`, updateError);
              errors++;
            } else {
              processed++;
              console.log(`✅ Generated embedding for document: ${doc.title}`);
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error processing document ${doc.title}:`, error);
            errors++;
          }
        }
      }

      // Process provisions without embeddings
      const { data: provisions, error: provError } = await supabase
        .from('legal_provisions')
        .select('id, title, content, law_identifier, provision_number')
        .eq('is_active', true)
        .is('embedding', null)
        .limit(batch_size);

      if (!provError && provisions && provisions.length > 0) {
        console.log(`📜 Processing ${provisions.length} provisions...`);
        
        for (const prov of provisions) {
          try {
            const textToEmbed = `${prov.law_identifier} § ${prov.provision_number}: ${prov.title}\n\n${prov.content || ''}`.trim();
            const embedding = await generateEmbedding(textToEmbed);

            const { error: updateError } = await supabase
              .from('legal_provisions')
              .update({ embedding })
              .eq('id', prov.id);

            if (updateError) {
              console.error(`Failed to update provision ${prov.law_identifier} § ${prov.provision_number}:`, updateError);
              errors++;
            } else {
              processed++;
              console.log(`✅ Generated embedding for provision: ${prov.law_identifier} § ${prov.provision_number}`);
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error processing provision ${prov.law_identifier} § ${prov.provision_number}:`, error);
            errors++;
          }
        }
      }
    }

    const response: GenerateEmbeddingsResponse = {
      success: processed > 0,
      processed,
      errors,
      message: `Processed ${processed} items with ${errors} errors`
    };

    console.log(`🎉 Legal embeddings generation completed: ${response.message}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-legal-embeddings:', error);
    return new Response(JSON.stringify({
      success: false,
      processed: 0,
      errors: 1,
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});