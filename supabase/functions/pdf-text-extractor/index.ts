import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { log } from "../_shared/log.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";
import { fetchDocumentMetadata, updateExtractionStatus } from "../_shared/document.ts";
import { getUserFromRequest, hasPermittedRole } from "../_shared/auth.ts";

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
    log('📄 [PDF-EXTRACTOR] Function invoked - starting comprehensive processing...');
    
    // Step 1: Parse and validate request
    let body;
    try {
      body = await req.json();
      log('📋 [PDF-EXTRACTOR] Request body parsed:', body);
    } catch (parseError) {
      console.error('❌ [PDF-EXTRACTOR] Failed to parse request body:', parseError);
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

    const user = getUserFromRequest(req);
    const permittedRoles = ['admin', 'partner', 'manager', 'employee'];
    if (!hasPermittedRole(user, permittedRoles)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!documentId) {
      console.error('❌ [PDF-EXTRACTOR] No documentId provided in request');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'documentId is required',
        details: 'Request must include documentId parameter'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('✅ [PDF-EXTRACTOR] Request validation passed for document:', documentId);

    // Step 2: Initialize Supabase client
    log('🔄 [PDF-EXTRACTOR] Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ [PDF-EXTRACTOR] Missing environment variables');
      return new Response(JSON.stringify({
        success: false,
        error: 'Server configuration error',
        details: 'Missing required environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = getSupabase(req);
    log('✅ [PDF-EXTRACTOR] Supabase client initialized');

    // Step 3: Update status to 'processing'
    log('🔄 [PDF-EXTRACTOR] Updating document status to processing...');
    const { error: statusError } = await updateExtractionStatus(
      supabaseAdmin,
      documentId,
      'processing'
    );

    if (statusError) {
      console.error('❌ [PDF-EXTRACTOR] Error updating status to processing:', statusError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database update failed',
        details: statusError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('✅ [PDF-EXTRACTOR] Status updated to processing');

    // Step 4: Fetch document to get file_path
    log('🔄 [PDF-EXTRACTOR] Fetching document metadata...');
    const { data: document, error: docError } = await fetchDocumentMetadata(
      supabaseAdmin,
      documentId
    );

    if (docError || !document) {
      console.error('❌ [PDF-EXTRACTOR] Error fetching document:', docError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Document not found',
        details: docError?.message || 'Document does not exist'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('✅ [PDF-EXTRACTOR] Document metadata retrieved:', {
      fileName: document.file_name,
      mimeType: document.mime_type,
      filePath: document.file_path
    });

    // Step 5: Download and extract text from the file
    let extractedText = '';
    
    try {
      log('📥 [PDF-EXTRACTOR] Downloading file from storage...');
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('client-documents')
        .download(document.file_path);

      if (downloadError || !fileData) {
        console.error('❌ [PDF-EXTRACTOR] Storage download error:', downloadError);
        throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
      }
      
      log('✅ [PDF-EXTRACTOR] File downloaded successfully, size:', fileData.size, 'bytes');

      if (document.mime_type === 'application/pdf') {
        log('📄 [PDF-EXTRACTOR] Processing PDF file...');
        
        // Convert blob to ArrayBuffer for PDF processing
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Enhanced PDF text extraction using multiple strategies
        log('🔍 [PDF-EXTRACTOR] Attempting multiple text extraction strategies...');
        
        // Strategy 1: Look for text streams in PDF
        const pdfText = new TextDecoder().decode(uint8Array);
        log('📝 [PDF-EXTRACTOR] PDF raw text length:', pdfText.length);
        
        // Strategy 1a: Extract text between stream markers
        const streamMatches = pdfText.match(/stream\s*(.*?)\s*endstream/gs);
        log('🔍 [PDF-EXTRACTOR] Found', streamMatches?.length || 0, 'streams');
        
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
            log('✅ [PDF-EXTRACTOR] Extracted from streams, length:', extractedText.length);
          }
        }
        
        // Strategy 1b: Look for text objects (BT...ET)
        if (!extractedText || extractedText.length < 50) {
          log('🔍 [PDF-EXTRACTOR] Trying text object extraction...');
          const textMatches = pdfText.match(/BT\s*(.*?)\s*ET/gs);
          log('📝 [PDF-EXTRACTOR] Found', textMatches?.length || 0, 'text objects');
          
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
              log('✅ [PDF-EXTRACTOR] Extracted from text objects, length:', extractedText.length);
            }
          }
        }
        
        // Strategy 2: Extract any readable ASCII text
        if (!extractedText || extractedText.length < 20) {
          log('🔍 [PDF-EXTRACTOR] Trying fallback ASCII extraction...');
          const readableText = pdfText
            .replace(/[^\x20-\x7E\s]/g, ' ') // Keep only printable ASCII
            .replace(/\s+/g, ' ')
            .trim();
          
          // Look for words (sequences of letters)
          const words = readableText.match(/[a-zA-ZæøåÆØÅ]{2,}/g) || [];
          log('📝 [PDF-EXTRACTOR] Found', words.length, 'potential words');
          
          if (words.length > 10) { // If we found enough words
            // Try to reconstruct meaningful text
            const meaningfulText = readableText
              .split(' ')
              .filter(word => /[a-zA-ZæøåÆØÅ]{2,}/.test(word) || /\d+/.test(word))
              .join(' ');
            
            if (meaningfulText.length > 50) {
              extractedText = meaningfulText.substring(0, 2000) + (meaningfulText.length > 2000 ? '...' : '');
              log('✅ [PDF-EXTRACTOR] Used fallback extraction, length:', extractedText.length);
            }
          }
        }
        
        // Final check - if we still don't have good text, report the issue
        if (!extractedText || extractedText.length < 10) {
          log('⚠️ [PDF-EXTRACTOR] PDF may be image-based or encrypted');
          extractedText = '[PDF inneholder sannsynligvis kun bilder eller er kryptert. Tekstekstraksjon ikke mulig med enkel metode.]';
        }
        
      } else if (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json')) {
        // For text files, read directly
        extractedText = await fileData.text();
        log('✅ [PDF-EXTRACTOR] Text file processed successfully, length:', extractedText.length);
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
        log('⚠️ [PDF-EXTRACTOR] Text truncated to fit database limits');
      }

      log('✅ [PDF-EXTRACTOR] Text extraction completed, final length:', extractedText.length);

    } catch (extractionError) {
      console.error('❌ [PDF-EXTRACTOR] Text extraction failed:', extractionError);
      
      // Update status to failed
      await updateExtractionStatus(
        supabaseAdmin,
        documentId,
        'failed',
        `[Tekstekstraksjon feilet: ${extractionError.message}]`
      );

      return new Response(JSON.stringify({ 
        success: false,
        error: 'Text extraction failed',
        details: extractionError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 6: Update document with extracted text and 'completed' status
    log('🔄 [PDF-EXTRACTOR] Saving extracted text to database...');
    const { error: updateError } = await updateExtractionStatus(
      supabaseAdmin,
      documentId,
      'completed',
      extractedText
    );

    if (updateError) {
      console.error('❌ [PDF-EXTRACTOR] Error saving extracted text:', updateError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to save extracted text',
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    log('🎉 [PDF-EXTRACTOR] Text extraction completed successfully for document:', documentId);
    log('📊 [PDF-EXTRACTOR] Final statistics:', {
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
      message: 'Text extraction completed successfully',
      preview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '')
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`💥 [PDF-EXTRACTOR] Unexpected error for document ${documentId || 'unknown'}:`, error);
    
    // Attempt to update the status to 'failed' if a documentId was available
    if (documentId) {
      try {
        const supabaseAdmin = getSupabase(req);
        await updateExtractionStatus(
          supabaseAdmin,
          documentId,
          'failed',
          `[Tekstekstraksjon feilet: ${error.message}]`
        );
        
        log('🔄 [PDF-EXTRACTOR] Status updated to failed for document:', documentId);
      } catch (updateError) {
        console.error(`❌ [PDF-EXTRACTOR] Failed to update status to failed for document ${documentId}:`, updateError);
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
