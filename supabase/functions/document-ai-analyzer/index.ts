
import "../xhr.ts";
import { log } from "../_shared/log.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";
import { chatWithFallback } from "../_shared/openai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


async function analyzeDocumentWithAI(text: string, fileName: string): Promise<string> {
  // Check if text is mostly PDF metadata/garbage
  const isGarbageText = text.includes('PDF obj') || 
                       text.includes('FlateDecode') || 
                       text.includes('Filter') ||
                       text.split(' ').filter(word => word.length > 2).length < 10;
  
  if (isGarbageText) {
    log('⚠️ [DOCUMENT-AI-ANALYZER] Text appears to be PDF metadata, providing generic analysis');
    return `Dette dokumentet ("${fileName}") ser ut til å være en PDF-fil som krever spesialisert tekstutvinning. 
    
    Basert på filnavnet kan dokumentet inneholde:
    - Regnskapsinformasjon eller økonomiske data
    - Revisjonsrelevant informasjon
    - Dokumentasjon som krever nærmere gjennomgang
    
    Anbefaler manuell gjennomgang av dette dokumentet da automatisk tekstutvinning ikke ga tilfredsstillende resultat.`;
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const { text: aiResponse } = await chatWithFallback({
    apiKey,
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
    maxTokens: 800,
  });

  return aiResponse;
}

Deno.serve(async (req) => {
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
      error: (error as Error).message,
      message: 'Failed to analyze document'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
