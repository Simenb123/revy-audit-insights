
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let documentId: string | null = null;
  
  try {
    const body = await req.json();
    documentId = body.documentId;

    if (!documentId) {
      throw new Error('documentId is required');
    }

    console.log('📄 [PDF-EXTRACTOR] Starting PDF text extraction for document:', documentId);

    // Use the Service Role Key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Set status to 'processing'
    const { error: statusError } = await supabaseAdmin
      .from('client_documents_files')
      .update({ 
        text_extraction_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (statusError) {
      console.error('❌ [PDF-EXTRACTOR] Error updating status to processing:', statusError);
    }

    // 2. Fetch document to get file_path
    const { data: document, error: docError } = await supabaseAdmin
      .from('client_documents_files')
      .select('file_path, file_name, mime_type')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Failed to fetch document: ${docError?.message || 'Not found'}`);
    }

    console.log('📄 [PDF-EXTRACTOR] Document found:', document.file_name, 'at path:', document.file_path);

    // 3. Download and extract text from the file
    let extractedText = '';
    
    try {
      console.log('📥 [PDF-EXTRACTOR] Downloading file from storage...');
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('client-documents')
        .download(document.file_path);

      if (downloadError || !fileData) {
        console.error('❌ [PDF-EXTRACTOR] Storage download error:', downloadError);
        throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
      }
      
      console.log('📄 [PDF-EXTRACTOR] File downloaded successfully, size:', fileData.size, 'bytes');

      if (document.mime_type === 'application/pdf') {
        console.log('📄 [PDF-EXTRACTOR] Processing PDF file...');
        
        // Convert blob to ArrayBuffer for PDF processing
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Enhanced PDF text extraction using multiple strategies
        console.log('🔍 [PDF-EXTRACTOR] Attempting text extraction strategies...');
        
        // Strategy 1: Look for text streams in PDF
        const pdfText = new TextDecoder().decode(uint8Array);
        console.log('📝 [PDF-EXTRACTOR] PDF raw text length:', pdfText.length);
        
        // Strategy 1a: Extract text between stream markers
        const streamMatches = pdfText.match(/stream\s*(.*?)\s*endstream/gs);
        console.log('🔍 [PDF-EXTRACTOR] Found', streamMatches?.length || 0, 'streams');
        
        if (streamMatches && streamMatches.length > 0) {
          const streamTexts = streamMatches.map(match => {
            const streamContent = match.replace(/stream|endstream/g, '').trim();
            // Try to extract readable text from stream
            const readableText = streamContent.replace(/[^\x20-\x7E\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            return readableText;
          }).filter(text => text.length > 10); // Only keep substantial text
          
          if (streamTexts.length > 0) {
            extractedText = streamTexts.join('\n\n').trim();
            console.log('✅ [PDF-EXTRACTOR] Extracted from streams, length:', extractedText.length);
          }
        }
        
        // Strategy 1b: Look for text objects (BT...ET)
        if (!extractedText || extractedText.length < 50) {
          console.log('🔍 [PDF-EXTRACTOR] Trying text object extraction...');
          const textMatches = pdfText.match(/BT\s*(.*?)\s*ET/gs);
          console.log('📝 [PDF-EXTRACTOR] Found', textMatches?.length || 0, 'text objects');
          
          if (textMatches && textMatches.length > 0) {
            const extractedParts = textMatches.map(match => {
              return match
                .replace(/BT|ET/g, '')
                .replace(/\/\w+\s+\d+(\.\d+)?\s+Tf/g, '') // Font declarations
                .replace(/\d+(\.\d+)?\s+\d+(\.\d+)?\s+Td/g, '') // Text positioning
                .replace(/\d+(\.\d+)?\s+TL/g, '') // Leading
                .replace(/\[|\]/g, '') // Array brackets
                .replace(/\((.*?)\)\s*Tj/g, '$1') // Text showing operators
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            }).filter(text => text.length > 0);
            
            if (extractedParts.length > 0) {
              extractedText = extractedParts.join('\n\n').trim();
              console.log('✅ [PDF-EXTRACTOR] Extracted from text objects, length:', extractedText.length);
            }
          }
        }
        
        // Strategy 2: Extract any readable ASCII text
        if (!extractedText || extractedText.length < 20) {
          console.log('🔍 [PDF-EXTRACTOR] Trying fallback ASCII extraction...');
          const readableText = pdfText
            .replace(/[^\x20-\x7E\s]/g, ' ') // Keep only printable ASCII
            .replace(/\s+/g, ' ')
            .trim();
          
          // Look for words (sequences of letters)
          const words = readableText.match(/[a-zA-ZæøåÆØÅ]{2,}/g) || [];
          console.log('📝 [PDF-EXTRACTOR] Found', words.length, 'potential words');
          
          if (words.length > 10) { // If we found enough words
            // Try to reconstruct meaningful text
            const meaningfulText = readableText
              .split(' ')
              .filter(word => /[a-zA-ZæøåÆØÅ]{2,}/.test(word) || /\d+/.test(word))
              .join(' ');
            
            if (meaningfulText.length > 50) {
              extractedText = meaningfulText.substring(0, 2000) + (meaningfulText.length > 2000 ? '...' : '');
              console.log('✅ [PDF-EXTRACTOR] Used fallback extraction, length:', extractedText.length);
            }
          }
        }
        
        // Final check - if we still don't have good text, report the issue
        if (!extractedText || extractedText.length < 10) {
          console.log('⚠️ [PDF-EXTRACTOR] PDF may be image-based or encrypted');
          extractedText = '[PDF inneholder sannsynligvis kun bilder eller er kryptert. Tekstekstraksjon ikke mulig med enkel metode.]';
        }
        
      } else if (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json')) {
        // For text files, read directly
        extractedText = await fileData.text();
        console.log('📄 [PDF-EXTRACTOR] Text file processed successfully, length:', extractedText.length);
      } else {
        throw new Error(`Unsupported file type: ${document.mime_type}`);
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content extracted from file');
      }

      // Limit text length to prevent database issues
      const maxLength = 50000; // 50KB limit
      if (extractedText.length > maxLength) {
        extractedText = extractedText.substring(0, maxLength) + '\n\n[Text truncated due to length limit]';
        console.log('⚠️ [PDF-EXTRACTOR] Text truncated to fit database limits');
      }

    } catch (extractionError) {
      console.error('❌ [PDF-EXTRACTOR] Text extraction failed:', extractionError);
      throw new Error(`Text extraction failed: ${extractionError.message}`);
    }

    // 4. Update document with extracted text and 'completed' status
    const { error: updateError } = await supabaseAdmin
      .from('client_documents_files')
      .update({
        extracted_text: extractedText,
        text_extraction_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('❌ [PDF-EXTRACTOR] Error saving extracted text:', updateError);
      throw new Error(`Failed to save extracted text: ${updateError.message}`);
    }
    
    console.log('✅ [PDF-EXTRACTOR] Text extraction completed successfully for document:', documentId);
    console.log('📊 [PDF-EXTRACTOR] Extracted text length:', extractedText.length, 'characters');
    
    return new Response(JSON.stringify({ 
      success: true, 
      documentId,
      textLength: extractedText.length,
      fileType: document.mime_type,
      message: 'Text extraction completed successfully',
      preview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '')
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`❌ [PDF-EXTRACTOR] Error in pdf-text-extractor for document ${documentId}:`, error);
    
    // Attempt to update the status to 'failed' if a documentId was parsed
    if (documentId) {
        try {
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );
            await supabaseAdmin.from('client_documents_files').update({
                text_extraction_status: 'failed',
                extracted_text: `[Tekstekstraksjon feilet: ${error.message}]`,
                updated_at: new Date().toISOString()
            }).eq('id', documentId);
            
            console.log('🔄 [PDF-EXTRACTOR] Status updated to failed for document:', documentId);
        } catch (e) {
            console.error(`❌ [PDF-EXTRACTOR] Failed to update status to failed for document ${documentId}:`, e);
        }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      documentId: documentId || 'unknown',
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
