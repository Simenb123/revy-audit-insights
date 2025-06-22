
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔧 Enhanced PDF text extractor started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    console.log('📄 Processing document:', documentId);
    
    if (!documentId) {
      throw new Error('DocumentId er påkrevd');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from('client_documents_files')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Kunne ikke finne dokument: ${docError?.message}`);
    }

    console.log('📋 Document found:', document.file_name);

    // Update status to processing
    await supabase
      .from('client_documents_files')
      .update({ 
        text_extraction_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('client-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Kunne ikke laste ned fil: ${downloadError?.message}`);
    }

    console.log('📥 File downloaded, size:', fileData.size);

    let extractedText = '';
    
    // Method 1: Try OpenAI Vision API for PDF reading (best quality)
    if (document.mime_type === 'application/pdf' && Deno.env.get('OPENAI_API_KEY')) {
      console.log('🤖 Trying OpenAI Vision API for PDF...');
      
      try {
        // Convert PDF to base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Les dette PDF-dokumentet og extraher all tekst. Behold formatering og struktur så godt som mulig. Returner kun den rene teksten uten kommentarer.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:application/pdf;base64,${base64}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 4000
          }),
        });

        if (openaiResponse.ok) {
          const aiResult = await openaiResponse.json();
          extractedText = aiResult.choices[0]?.message?.content || '';
          console.log('✅ OpenAI Vision extraction successful:', extractedText.length, 'characters');
        } else {
          console.log('⚠️ OpenAI Vision failed, trying fallback method');
        }
      } catch (error) {
        console.log('⚠️ OpenAI Vision error:', error.message);
      }
    }

    // Method 2: Fallback - Try PDF-lib or simple text extraction
    if (!extractedText && document.mime_type === 'application/pdf') {
      console.log('📖 Trying fallback PDF text extraction...');
      
      try {
        // For now, we'll use a simple approach - in production you might want pdf-parse
        const text = await fileData.text();
        extractedText = text || '[PDF innhold krever avansert tekstekstraksjon]';
        console.log('✅ Fallback extraction completed:', extractedText.length, 'characters');
      } catch (error) {
        console.log('⚠️ Fallback extraction failed:', error.message);
        extractedText = '[Kunne ikke ekstraktere tekst fra PDF. Filen kan være skannet eller passordbeskyttet.]';
      }
    }

    // Method 3: Handle text files and other formats
    if (!extractedText && (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json'))) {
      console.log('📝 Extracting text from text-based file...');
      extractedText = await fileData.text();
    }

    // If still no text, provide informative message
    if (!extractedText) {
      extractedText = `[Tekstekstraksjon ikke støttet for filtype: ${document.mime_type}. Vurder å konvertere til PDF eller tekst-format.]`;
    }

    // Enhanced text with AI analysis
    let aiAnalysis = '';
    if (extractedText && extractedText.length > 50 && Deno.env.get('OPENAI_API_KEY')) {
      console.log('🧠 Generating AI analysis of extracted text...');
      
      try {
        const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Du er en revisjon AI-assistent. Analyser dokumentet og gi en kort sammendrag på norsk (max 200 ord) som fokuserer på revisjonsrelevant innhold.'
              },
              {
                role: 'user',
                content: `Analyser dette dokumentet og gi et sammendrag som er relevant for revisjon:\n\n${extractedText.substring(0, 3000)}`
              }
            ],
            max_tokens: 300,
            temperature: 0.3
          }),
        });

        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          aiAnalysis = analysisResult.choices[0]?.message?.content || '';
          console.log('✅ AI analysis completed');
        }
      } catch (error) {
        console.log('⚠️ AI analysis failed:', error.message);
      }
    }

    // Update document with extracted text and analysis
    const updateData = {
      extracted_text: extractedText,
      text_extraction_status: 'completed',
      ai_analysis_summary: aiAnalysis || null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('client_documents_files')
      .update(updateData)
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Kunne ikke oppdatere dokument: ${updateError.message}`);
    }

    console.log('✅ Document updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        textLength: extractedText.length,
        hasAiAnalysis: !!aiAnalysis,
        message: 'Tekstekstraksjon fullført'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Enhanced PDF extraction error:', error);
    
    // Try to update document status to failed
    if (error.message !== 'DocumentId er påkrevd') {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('client_documents_files')
          .update({ 
            text_extraction_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', (await req.json())?.documentId);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
