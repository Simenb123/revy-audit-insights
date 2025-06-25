
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { log } from "../_shared/log.ts";

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

async function analyzeDocumentWithAI(text: string, fileName: string): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en AI-assistent som analyserer revisjonsdokumenter. Analyser følgende dokument og gi en kort sammendrag på norsk som inkluderer:
          - Hovedinnhold og formål
          - Relevante revisjonsområder (f.eks. ISA-standarder, risikoområder)
          - Viktige nøkkelord og begreper
          - Anbefalte kategoriseringer
          
          Hold sammendraget under 200 ord og fokuser på revisjonsrelevant informasjon.`
        },
        {
          role: 'user',
          content: `Analyser dette dokumentet: "${fileName}"\n\nInnhold:\n${text.substring(0, 4000)}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabase(req);
    const { documentId, text, fileName } = await req.json();
    
    if (!documentId || !text || !fileName) {
      throw new Error('documentId, text, and fileName are required');
    }

    log(`🔄 Analyzing document: ${fileName} (ID: ${documentId})`);
    
    // Generate AI analysis
    const aiAnalysis = await analyzeDocumentWithAI(text, fileName);
    
    // Update document with AI analysis
    const { error: updateError } = await supabase
      .from('client_documents_files')
      .update({ 
        ai_analysis_summary: aiAnalysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('❌ Error updating document with AI analysis:', updateError);
      throw updateError;
    }

    log(`✅ AI analysis completed for document: ${fileName}`);
    
    return new Response(JSON.stringify({ 
      success: true,
      analysis: aiAnalysis,
      message: 'AI analysis completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in document-ai-analyzer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to analyze document'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
