
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔧 Enhanced PDF text extractor started with improved debugging');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    console.log('📄 Processing document:', documentId);
    
    if (!documentId) {
      console.error('❌ DocumentId er påkrevd men mangler');
      throw new Error('DocumentId er påkrevd');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('✅ Supabase client initialized');

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from('client_documents_files')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('❌ Kunne ikke finne dokument:', docError?.message);
      throw new Error(`Kunne ikke finne dokument: ${docError?.message}`);
    }

    console.log('📋 Document found:', {
      fileName: document.file_name,
      mimeType: document.mime_type,
      fileSize: document.file_size,
      currentStatus: document.text_extraction_status
    });

    // Update status to processing
    console.log('🔄 Updating status to processing...');
    await supabase
      .from('client_documents_files')
      .update({ 
        text_extraction_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    console.log('✅ Status updated to processing');

    // Download file from storage
    console.log('📥 Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('client-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('❌ Kunne ikke laste ned fil:', downloadError?.message);
      throw new Error(`Kunne ikke laste ned fil: ${downloadError?.message}`);
    }

    console.log('✅ File downloaded successfully, size:', fileData.size);

    let extractedText = '';
    let extractionMethod = '';
    
    // Check if OpenAI API key is available
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('🔑 OpenAI API key available:', !!openaiApiKey);

    // Method 1: Try OpenAI Vision API for PDF reading (best quality)
    if (document.mime_type === 'application/pdf' && openaiApiKey) {
      console.log('🤖 Attempting OpenAI Vision API for PDF text extraction...');
      
      try {
        // Convert PDF to base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        console.log('📸 PDF converted to base64, size:', base64.length);

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
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
                    text: 'Les dette PDF-dokumentet nøye og ekstraher ALL tekst. Behold formatering, tabeller, overskrifter og struktur så godt som mulig. Inkluder alle tall, datoer og detaljer. Returner kun den rene teksten uten kommentarer eller tilleggsinformasjon.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:application/pdf;base64,${base64}`,
                      detail: 'high'
                    }
                  }
                ]
              }
            ],
            max_tokens: 4000,
            temperature: 0.1
          }),
        });

        console.log('📡 OpenAI API response status:', openaiResponse.status);

        if (openaiResponse.ok) {
          const aiResult = await openaiResponse.json();
          extractedText = aiResult.choices[0]?.message?.content || '';
          extractionMethod = 'OpenAI Vision API';
          console.log('✅ OpenAI Vision extraction successful:', {
            textLength: extractedText.length,
            preview: extractedText.substring(0, 200) + '...'
          });
        } else {
          const errorText = await openaiResponse.text();
          console.error('❌ OpenAI Vision API error:', errorText);
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }
      } catch (error) {
        console.error('❌ OpenAI Vision extraction failed:', error.message);
        // Continue to fallback method
      }
    }

    // Method 2: Fallback - Simple text extraction for PDFs
    if (!extractedText && document.mime_type === 'application/pdf') {
      console.log('📖 Attempting fallback PDF text extraction...');
      
      try {
        // Simple text extraction from PDF
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const text = new TextDecoder().decode(uint8Array);
        
        // Look for text content patterns in PDF
        const textMatches = text.match(/\((.*?)\)\s*Tj/g);
        if (textMatches && textMatches.length > 0) {
          extractedText = textMatches
            .map(match => match.replace(/\(|\)\s*Tj/g, ''))
            .join(' ')
            .replace(/\\[rn]/g, '\n')
            .trim();
          extractionMethod = 'PDF Text Parsing';
          console.log('✅ Fallback PDF extraction successful:', extractedText.length, 'characters');
        } else {
          // Try simple string extraction
          const readableText = text
            .replace(/[^\x20-\x7E\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (readableText.length > 100) {
            extractedText = readableText.substring(0, 2000);
            extractionMethod = 'Simple Text Extraction';
            console.log('✅ Simple text extraction completed:', extractedText.length, 'characters');
          }
        }
      } catch (error) {
        console.error('❌ Fallback PDF extraction failed:', error.message);
      }
    }

    // Method 3: Handle text files and other formats
    if (!extractedText && (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json'))) {
      console.log('📝 Extracting text from text-based file...');
      extractedText = await fileData.text();
      extractionMethod = 'Direct Text Reading';
      console.log('✅ Text file extraction completed:', extractedText.length, 'characters');
    }

    // If still no text, provide informative message
    if (!extractedText || extractedText.trim().length < 10) {
      console.log('⚠️ No meaningful text extracted, setting informative message');
      extractedText = `[Kunne ikke ekstraktere tekst fra denne filen. Filtype: ${document.mime_type}. ${!openaiApiKey ? 'OpenAI API-nøkkel mangler for avansert PDF-lesing.' : 'Filen kan være skannet, passordbeskyttet eller inneholde kun bilder.'}]`;
      extractionMethod = 'No extraction possible';
    }

    // Enhanced AI analysis if we have meaningful text
    let aiAnalysis = '';
    if (extractedText && extractedText.length > 50 && !extractedText.startsWith('[Kunne ikke') && openaiApiKey) {
      console.log('🧠 Generating AI analysis of extracted text...');
      
      try {
        const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Du er en norsk revisjonsekspert. Analyser dokumentet og gi et kort, presist sammendrag på norsk (max 300 ord) som fokuserer på revisjonsrelevant innhold som: beløp, datoer, transaksjoner, regnskapsposter, kontrakter, eller andre revisjonsrelevante detaljer.'
              },
              {
                role: 'user',
                content: `Analyser dette dokumentet og gi et detaljert sammendrag:\n\nFilnavn: ${document.file_name}\n\nInnhold:\n${extractedText.substring(0, 4000)}`
              }
            ],
            max_tokens: 400,
            temperature: 0.2
          }),
        });

        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          aiAnalysis = analysisResult.choices[0]?.message?.content || '';
          console.log('✅ AI analysis completed:', aiAnalysis.length, 'characters');
        } else {
          console.error('❌ AI analysis failed:', analysisResponse.status);
        }
      } catch (error) {
        console.error('❌ AI analysis error:', error.message);
      }
    }

    // Update document with extracted text and analysis
    console.log('💾 Saving extracted text and analysis to database...');
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
      console.error('❌ Kunne ikke oppdatere dokument:', updateError.message);
      throw new Error(`Kunne ikke oppdatere dokument: ${updateError.message}`);
    }

    console.log('🎉 Document processing completed successfully!');
    console.log('📊 Final results:', {
      documentId,
      fileName: document.file_name,
      textLength: extractedText.length,
      extractionMethod,
      hasAiAnalysis: !!aiAnalysis,
      success: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        fileName: document.file_name,
        textLength: extractedText.length,
        extractionMethod,
        hasAiAnalysis: !!aiAnalysis,
        preview: extractedText.substring(0, 300) + (extractedText.length > 300 ? '...' : ''),
        message: 'Avansert tekstekstraksjon fullført med suksess'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Enhanced PDF extraction error:', error);
    
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
            extracted_text: `[Tekstekstraksjon feilet: ${error.message}]`,
            updated_at: new Date().toISOString()
          })
          .eq('id', (await req.json())?.documentId);
        
        console.log('✅ Status updated to failed');
      } catch (updateError) {
        console.error('❌ Failed to update error status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Se server logs for mer detaljert feilsøking'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
