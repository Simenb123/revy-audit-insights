
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let documentId: string | null = null;
  
  try {
    console.log('📄 [ENHANCED-PDF-EXTRACTOR] Function invoked with improved error handling...');
    
    // Step 1: Parse and validate request
    let body;
    try {
      body = await req.json();
      console.log('📋 [ENHANCED-PDF-EXTRACTOR] Request body parsed:', body);
    } catch (parseError) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    documentId = body.documentId;

    if (!documentId) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] No documentId provided in request');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'documentId is required',
        details: 'Request must include documentId parameter'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [ENHANCED-PDF-EXTRACTOR] Request validation passed for document:', documentId);

    // Step 2: Initialize Supabase client
    console.log('🔄 [ENHANCED-PDF-EXTRACTOR] Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] Missing environment variables');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Server configuration error',
        details: 'Missing required environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ [ENHANCED-PDF-EXTRACTOR] Supabase client initialized');

    // Step 3: Update status to 'processing'
    console.log('🔄 [ENHANCED-PDF-EXTRACTOR] Updating document status to processing...');
    const { error: statusError } = await supabaseAdmin
      .from('client_documents_files')
      .update({ 
        text_extraction_status: 'processing',
        extracted_text: '[Forbedret backend prosessering startet...]',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (statusError) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] Error updating status to processing:', statusError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database update failed',
        details: statusError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [ENHANCED-PDF-EXTRACTOR] Status updated to processing');

    // Step 4: Fetch document to get file_path
    console.log('🔄 [ENHANCED-PDF-EXTRACTOR] Fetching document metadata...');
    const { data: document, error: docError } = await supabaseAdmin
      .from('client_documents_files')
      .select('file_path, file_name, mime_type')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] Error fetching document:', docError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Document not found',
        details: docError?.message || 'Document does not exist'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [ENHANCED-PDF-EXTRACTOR] Document metadata retrieved:', {
      fileName: document.file_name,
      mimeType: document.mime_type,
      filePath: document.file_path
    });

    // Step 5: Download and process the file with improved error handling
    let extractedText = '';
    
    try {
      console.log('📥 [ENHANCED-PDF-EXTRACTOR] Downloading file from storage...');
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('client-documents')
        .download(document.file_path);

      if (downloadError || !fileData) {
        console.error('❌ [ENHANCED-PDF-EXTRACTOR] Storage download error:', downloadError);
        throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
      }
      
      console.log('✅ [ENHANCED-PDF-EXTRACTOR] File downloaded successfully, size:', fileData.size, 'bytes');

      if (document.mime_type === 'application/pdf') {
        console.log('📄 [ENHANCED-PDF-EXTRACTOR] Processing PDF file with improved methods...');
        
        // Convert blob to ArrayBuffer for PDF processing
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Enhanced PDF text extraction with better stack overflow protection
        console.log('🔍 [ENHANCED-PDF-EXTRACTOR] Using enhanced PDF text extraction...');
        
        // Strategy 1: Try to extract text streams safely
        const pdfText = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
        console.log('📝 [ENHANCED-PDF-EXTRACTOR] PDF decoded, raw text length:', pdfText.length);
        
        // Use safer regex patterns to avoid stack overflow
        let textParts: string[] = [];
        
        // Extract text objects with size limits to prevent stack overflow
        const maxChunkSize = 100000; // Process in smaller chunks
        const chunks = [];
        for (let i = 0; i < pdfText.length; i += maxChunkSize) {
          chunks.push(pdfText.slice(i, i + maxChunkSize));
        }
        
        for (const chunk of chunks) {
          try {
            // Look for text showing operators (safer approach)
            const simpleTextMatches = chunk.match(/\((.*?)\)\s*Tj/g);
            if (simpleTextMatches && simpleTextMatches.length > 0) {
              const chunkTexts = simpleTextMatches
                .map(match => match.replace(/\((.*?)\)\s*Tj/, '$1'))
                .filter(text => text.length > 0 && text.length < 1000) // Avoid very long strings
                .slice(0, 100); // Limit number of matches per chunk
              
              textParts.push(...chunkTexts);
            }
          } catch (chunkError) {
            console.warn('⚠️ Error processing chunk, skipping:', chunkError.message);
            continue;
          }
        }
        
        if (textParts.length > 0) {
          extractedText = textParts.join(' ').trim();
          console.log('✅ [ENHANCED-PDF-EXTRACTOR] Extracted from text objects, length:', extractedText.length);
        }
        
        // Fallback: Extract readable ASCII with size limits
        if (!extractedText || extractedText.length < 20) {
          console.log('🔍 [ENHANCED-PDF-EXTRACTOR] Trying fallback ASCII extraction...');
          try {
            const readableText = pdfText
              .slice(0, 500000) // Limit input size
              .replace(/[^\x20-\x7E\s]/g, ' ') // Keep only printable ASCII
              .replace(/\s+/g, ' ')
              .trim();
            
            // Look for words (sequences of letters) with limits
            const words = readableText.match(/[a-zA-ZæøåÆØÅ]{2,}/g)?.slice(0, 1000) || [];
            console.log('📝 [ENHANCED-PDF-EXTRACTOR] Found', words.length, 'potential words');
            
            if (words.length > 10) {
              const meaningfulText = words.join(' ');
              if (meaningfulText.length > 50) {
                extractedText = meaningfulText.substring(0, 3000) + (meaningfulText.length > 3000 ? '...' : '');
                console.log('✅ [ENHANCED-PDF-EXTRACTOR] Used fallback extraction, length:', extractedText.length);
              }
            }
          } catch (fallbackError) {
            console.warn('⚠️ Fallback extraction failed:', fallbackError.message);
          }
        }
        
        // Final check
        if (!extractedText || extractedText.length < 10) {
          console.log('⚠️ [ENHANCED-PDF-EXTRACTOR] PDF may be image-based or encrypted');
          extractedText = '[PDF inneholder sannsynligvis kun bilder eller er kryptert. Avansert tekstekstraksjon ikke mulig.]';
        }
        
      } else if (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json')) {
        // For text files, read directly
        extractedText = await fileData.text();
        console.log('✅ [ENHANCED-PDF-EXTRACTOR] Text file processed successfully, length:', extractedText.length);
      } else {
        // For Excel files and others, inform about limitation
        extractedText = '[Filtype krever spesialisert prosessering. Bruk frontend-ekstrasjon for Excel-filer.]';
        console.log('ℹ️ [ENHANCED-PDF-EXTRACTOR] File type requires specialized processing:', document.mime_type);
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        extractedText = '[Ingen tekstinnhold funnet i dokumentet.]';
      }

      // Limit text length to prevent database issues
      const maxLength = 50000; // 50KB limit
      if (extractedText.length > maxLength) {
        extractedText = extractedText.substring(0, maxLength) + '\n\n[Tekst forkortet på grunn av størrelse]';
        console.log('⚠️ [ENHANCED-PDF-EXTRACTOR] Text truncated to fit database limits');
      }

      console.log('✅ [ENHANCED-PDF-EXTRACTOR] Text extraction completed, final length:', extractedText.length);

    } catch (extractionError) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] Text extraction failed:', extractionError);
      
      // Provide meaningful error text instead of failing
      extractedText = `[Forbedret tekstekstraksjon feilet: ${extractionError.message}. Dokumentet kan være skannet eller kryptert.]`;
    }

    // Step 6: Update document with extracted text and 'completed' status
    console.log('🔄 [ENHANCED-PDF-EXTRACTOR] Saving extracted text to database...');
    const { error: updateError } = await supabaseAdmin
      .from('client_documents_files')
      .update({
        extracted_text: extractedText,
        text_extraction_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] Error saving extracted text:', updateError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to save extracted text',
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('🎉 [ENHANCED-PDF-EXTRACTOR] Text extraction completed successfully for document:', documentId);
    console.log('📊 [ENHANCED-PDF-EXTRACTOR] Final statistics:', {
      documentId,
      fileName: document.file_name,
      textLength: extractedText.length,
      fileType: document.mime_type
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      documentId,
      textLength: extractedText.length,
      fileType: document.mime_type,
      extractionMethod: 'Enhanced backend processing',
      message: 'Enhanced text extraction completed successfully',
      preview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '')
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`💥 [ENHANCED-PDF-EXTRACTOR] Unexpected error for document ${documentId || 'unknown'}:`, error);
    
    // Attempt to update the status to 'completed' with error message instead of 'failed'
    if (documentId) {
      try {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabaseAdmin.from('client_documents_files').update({
          text_extraction_status: 'completed',
          extracted_text: `[Systemfeil under tekstekstraksjon: ${error.message}]`,
          updated_at: new Date().toISOString()
        }).eq('id', documentId);
        
        console.log('🔄 [ENHANCED-PDF-EXTRACTOR] Status updated with error message for document:', documentId);
      } catch (updateError) {
        console.error(`❌ [ENHANCED-PDF-EXTRACTOR] Failed to update status for document ${documentId}:`, updateError);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Unexpected server error',
      documentId: documentId || 'unknown',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
