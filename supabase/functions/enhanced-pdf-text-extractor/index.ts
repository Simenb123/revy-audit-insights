
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔧 Enhanced PDF text extractor started - v2.0 with improved error handling');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody: any = null;
  let documentId: string | null = null;

  try {
    // Robust request body parsing with multiple fallbacks
    const rawBody = await req.text();
    console.log('📄 Raw request body received:', rawBody.substring(0, 200));
    
    if (!rawBody || rawBody.trim() === '') {
      throw new Error('Request body is empty');
    }

    try {
      requestBody = JSON.parse(rawBody);
      console.log('✅ Request body parsed successfully:', { hasDocumentId: !!requestBody?.documentId });
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }

    documentId = requestBody?.documentId;
    
    if (!documentId) {
      console.error('❌ DocumentId missing from request');
      throw new Error('DocumentId er påkrevd');
    }

    console.log('📄 Processing document:', documentId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from('client_documents_files')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('❌ Document not found:', docError?.message);
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
    const { error: updateError } = await supabase
      .from('client_documents_files')
      .update({ 
        text_extraction_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('❌ Status update failed:', updateError);
      throw new Error(`Status update failed: ${updateError.message}`);
    }

    console.log('✅ Status updated to processing');

    // Download file from storage
    console.log('📥 Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('client-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('❌ File download failed:', downloadError?.message);
      throw new Error(`Kunne ikke laste ned fil: ${downloadError?.message}`);
    }

    console.log('✅ File downloaded successfully, size:', fileData.size);

    let extractedText = '';
    let extractionMethod = 'Unknown';
    let aiAnalysis = '';
    
    // Check if OpenAI API key is available
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('🔑 OpenAI API key available:', !!openaiApiKey);

    // Enhanced text extraction based on file type
    if (document.mime_type === 'application/pdf' && openaiApiKey) {
      console.log('🤖 Attempting OpenAI Vision API for PDF...');
      
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        console.log('📸 PDF converted to base64, attempting Vision API...');

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
                    text: 'Les dette PDF-dokumentet nøye og ekstraher ALL tekst. Behold formatering, tabeller, overskrifter og struktur så godt som mulig. Inkluder alle tall, datoer og detaljer. Returner kun den rene teksten uten kommentarer.'
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

        if (openaiResponse.ok) {
          const aiResult = await openaiResponse.json();
          extractedText = aiResult.choices[0]?.message?.content || '';
          extractionMethod = 'OpenAI Vision API';
          console.log('✅ OpenAI Vision extraction successful:', extractedText.length, 'characters');
        } else {
          const errorData = await openaiResponse.text();
          console.error('❌ OpenAI Vision API error:', openaiResponse.status, errorData);
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }
      } catch (error) {
        console.error('❌ OpenAI Vision extraction failed:', error.message);
        extractedText = `[OpenAI Vision feilet: ${error.message}]`;
        extractionMethod = 'OpenAI Vision Failed';
      }
    }

    // Handle Excel/CSV files
    else if (document.mime_type?.includes('spreadsheet') || document.mime_type?.includes('excel') || document.mime_type?.includes('csv')) {
      console.log('📊 Processing Excel/CSV file...');
      try {
        if (document.mime_type.includes('csv')) {
          extractedText = await fileData.text();
          extractionMethod = 'CSV Text Reading';
        } else {
          // For Excel files, provide basic info
          extractedText = `Excel-fil: ${document.file_name}\nFilstørrelse: ${(document.file_size / 1024).toFixed(1)} KB\nType: ${document.mime_type}\n\n[Dette er en Excel-fil. For full analyse, åpne filen i Excel eller konverter til CSV-format.]`;
          extractionMethod = 'Excel Metadata';
        }
        console.log('✅ Spreadsheet processing completed:', extractedText.length, 'characters');
      } catch (error) {
        console.error('❌ Spreadsheet processing failed:', error.message);
        extractedText = `[Kunne ikke lese regneark: ${error.message}]`;
        extractionMethod = 'Spreadsheet Failed';
      }
    }

    // Handle text files
    else if (document.mime_type?.includes('text/')) {
      console.log('📝 Processing text file...');
      try {
        extractedText = await fileData.text();
        extractionMethod = 'Direct Text Reading';
        console.log('✅ Text file processing completed:', extractedText.length, 'characters');
      } catch (error) {
        console.error('❌ Text file processing failed:', error.message);
        extractedText = `[Kunne ikke lese tekstfil: ${error.message}]`;
        extractionMethod = 'Text Reading Failed';
      }
    }

    // If no extraction method worked
    if (!extractedText || extractedText.trim().length < 10) {
      console.log('⚠️ No meaningful text extracted, setting informative message');
      extractedText = `[Kunne ikke ekstraktere tekst fra denne filen]
      
Filtype: ${document.mime_type}
Filnavn: ${document.file_name}
Størrelse: ${(document.file_size / 1024 / 1024).toFixed(2)} MB

${!openaiApiKey ? '⚠️ OpenAI API-nøkkel mangler for avansert PDF-lesing.' : ''}

Mulige årsaker:
- Filen er skannet og inneholder kun bilder
- Filen er passordbeskyttet
- Filformat støttes ikke fullt ut
- Filen er tom eller skadet`;
      extractionMethod = 'No extraction possible';
    }

    // Generate AI analysis if we have meaningful text
    if (extractedText && extractedText.length > 50 && !extractedText.startsWith('[Kunne ikke') && openaiApiKey) {
      console.log('🧠 Generating AI analysis...');
      
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

    // Update document with results
    console.log('💾 Saving results to database...');
    const updateData = {
      extracted_text: extractedText,
      text_extraction_status: 'completed',
      ai_analysis_summary: aiAnalysis || null,
      updated_at: new Date().toISOString()
    };

    const { error: finalUpdateError } = await supabase
      .from('client_documents_files')
      .update(updateData)
      .eq('id', documentId);

    if (finalUpdateError) {
      console.error('❌ Final update failed:', finalUpdateError.message);
      throw new Error(`Final update failed: ${finalUpdateError.message}`);
    }

    console.log('🎉 Text extraction completed successfully!');
    
    const response = {
      success: true,
      documentId,
      fileName: document.file_name,
      textLength: extractedText.length,
      extractionMethod,
      hasAiAnalysis: !!aiAnalysis,
      preview: extractedText.substring(0, 300) + (extractedText.length > 300 ? '...' : ''),
      message: 'Tekstekstraksjon fullført med suksess'
    };

    console.log('📊 Final results:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Text extraction error:', error.message);
    
    // Try to update document status to failed if we have a documentId
    if (documentId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          await supabase
            .from('client_documents_files')
            .update({ 
              text_extraction_status: 'failed',
              extracted_text: `[Tekstekstraksjon feilet: ${error.message}]`,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          
          console.log('✅ Status updated to failed');
        }
      } catch (updateError) {
        console.error('❌ Failed to update error status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Tekstekstraksjon feilet - se server logs for detaljer'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
