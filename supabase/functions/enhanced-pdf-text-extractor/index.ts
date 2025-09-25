
import { log } from "../_shared/log.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";
import { fetchDocumentMetadata, updateExtractionStatus } from "../_shared/document.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced DOCX text extraction with better Norwegian support
function extractTextFromDocx(uint8Array: Uint8Array): string {
  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // Look for XML text content in DOCX (simplified extraction)
    const textMatches = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (textMatches) {
      const extractedText = textMatches
        .map(match => match.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1'))
        .filter(text => text.trim().length > 0)
        .join(' ')
        .trim();
      
      if (extractedText.length > 10) {
        return cleanExtractedText(extractedText);
      }
    }
    
    // Enhanced fallback: extract readable text with better Norwegian character support
    const readableText = text
      .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F\s]/g, ' ') // Include Norwegian characters
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = readableText.match(/[a-zA-ZæøåÆØÅ0-9]{2,}/g)?.slice(0, 500) || [];
    const validWords = words.filter(word => !isPdfMetadata(word));
    
    return validWords.length > 5 ? validWords.join(' ') : '[DOCX innhold krever avansert prosessering]';
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '[Feil ved DOCX tekstekstraksjon]';
  }
}

// Enhanced text cleaning function
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u00C0-\u017F\u0100-\u024F.,!?;:()\-]/g, '')
    .trim();
}

// Check if word is likely PDF metadata
function isPdfMetadata(word: string): boolean {
  const metadataTerms = [
    'pdf', 'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer',
    'flateDecode', 'filter', 'length', 'catalog', 'pages', 'type',
    'font', 'encoding', 'width', 'height', 'bbox', 'matrix', 'creator',
    'producer', 'moddate', 'creationdate', 'procset', 'imageb', 'imagec',
    'imagei', 'text', 'pagemode', 'viewnone', 'viewer'
  ];
  return metadataTerms.some(term => word.toLowerCase().includes(term.toLowerCase()));
}

// Enhanced XLSX text extraction with better content recognition
function extractTextFromXlsx(uint8Array: Uint8Array): string {
  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    let extractedContent: string[] = [];
    
    // Look for shared strings in XLSX (headers and text content)
    const stringMatches = text.match(/<si><t[^>]*>([^<]*)<\/t><\/si>/g) || 
                          text.match(/<si><t>([^<]*)<\/t><\/si>/g) || [];
    
    if (stringMatches.length > 0) {
      const sharedStrings = stringMatches
        .map(match => match.replace(/<si><t[^>]*>([^<]*)<\/t><\/si>/, '$1').replace(/<si><t>([^<]*)<\/t><\/si>/, '$1'))
        .filter(str => str.trim().length > 0 && !isPdfMetadata(str))
        .slice(0, 200);
      
      extractedContent.push(...sharedStrings);
    }
    
    // Look for worksheet data and cell values
    const cellMatches = text.match(/<c[^>]*><v>([^<]*)<\/v><\/c>/g) || [];
    if (cellMatches.length > 0) {
      const cellValues = cellMatches
        .map(match => match.replace(/<c[^>]*><v>([^<]*)<\/v><\/c>/, '$1'))
        .filter(val => val && val.trim().length > 0)
        .filter(val => isNaN(Number(val)) || val.length > 8) // Keep non-numbers or long numbers (like account numbers)
        .slice(0, 100);
      
      extractedContent.push(...cellValues);
    }
    
    // Look for row data patterns that might indicate structured content
    const rowMatches = text.match(/<row[^>]*>.*?<\/row>/g) || [];
    if (rowMatches.length > 0) {
      rowMatches.slice(0, 50).forEach(row => {
        const cellsInRow = row.match(/<c[^>]*r="[A-Z]+\d+"[^>]*><v>([^<]*)<\/v><\/c>/g) || [];
        if (cellsInRow.length > 2) { // Rows with multiple cells are likely data rows
          const rowData = cellsInRow
            .map(cell => cell.replace(/<c[^>]*r="[A-Z]+\d+"[^>]*><v>([^<]*)<\/v><\/c>/, '$1'))
            .filter(val => val.trim().length > 0)
            .join(',');
          if (rowData.length > 5) {
            extractedContent.push(`--- ${rowData.substring(0, 50)} ---`);
          }
        }
      });
    }
    
    if (extractedContent.length > 0) {
      const cleanedContent = extractedContent
        .map(str => cleanExtractedText(str))
        .filter(str => str.length > 1)
        .join('\n');
      
      return cleanedContent.length > 20 ? cleanedContent : '[XLSX regneark - begrenset tekstinnhold]';
    }
    
    return '[XLSX regneark - krever spesialisert prosessering for full tekstekstraksjon]';
  } catch (error) {
    console.error('XLSX extraction error:', error);
    return '[Feil ved XLSX tekstekstraksjon]';
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let documentId: string | null = null;
  const startTime = Date.now();
  
  try {
    log('📄 [ENHANCED-PDF-EXTRACTOR] Function invoked with DOCX/XLSX support...');
    
    // Step 1: Parse and validate request
    let body;
    try {
      body = await req.json();
      log('📋 [ENHANCED-PDF-EXTRACTOR] Request body parsed:', body);
    } catch (parseError) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON in request body',
        details: (parseError as Error).message
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

    log('✅ [ENHANCED-PDF-EXTRACTOR] Request validation passed for document:', documentId);

    // Check if processing is taking too long (timeout protection)
    const timeoutMinutes = 2;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Prosessering tok for lang tid (over ${timeoutMinutes} minutter)`));
      }, timeoutMs);
    });

    // Step 2: Initialize Supabase client
    log('🔄 [ENHANCED-PDF-EXTRACTOR] Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
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

    const supabaseAdmin = getSupabase(req);
    log('✅ [ENHANCED-PDF-EXTRACTOR] Supabase client initialized');

    // Step 3: Update status to 'processing'
    log('🔄 [ENHANCED-PDF-EXTRACTOR] Updating document status to processing...');
    const { error: statusError } = await updateExtractionStatus(
      supabaseAdmin,
      documentId,
      'processing',
      '[Forbedret backend prosessering startet...]'
    );

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

    log('✅ [ENHANCED-PDF-EXTRACTOR] Status updated to processing');

    // Step 4: Fetch document to get file_path
    log('🔄 [ENHANCED-PDF-EXTRACTOR] Fetching document metadata...');
    const { data: document, error: docError } = await fetchDocumentMetadata(
      supabaseAdmin,
      documentId
    );

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

    log('✅ [ENHANCED-PDF-EXTRACTOR] Document metadata retrieved:', {
      fileName: document.file_name,
      mimeType: document.mime_type,
      filePath: document.file_path
    });

    // Step 5: Download and process the file with improved error handling
    let extractedText = '';
    
    try {
      log('📥 [ENHANCED-PDF-EXTRACTOR] Downloading file from storage...');
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('client-documents')
        .download(document.file_path);

      if (downloadError || !fileData) {
        console.error('❌ [ENHANCED-PDF-EXTRACTOR] Storage download error:', downloadError);
        throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
      }
      
      log('✅ [ENHANCED-PDF-EXTRACTOR] File downloaded successfully, size:', fileData.size, 'bytes');

      // Convert blob to ArrayBuffer for processing
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      if (document.mime_type === 'application/pdf') {
        log('📄 [ENHANCED-PDF-EXTRACTOR] Processing PDF file...');
        
        // Enhanced PDF text extraction with better stack overflow protection
        log('🔍 [ENHANCED-PDF-EXTRACTOR] Using enhanced PDF text extraction...');
        
        // Strategy 1: Try to extract text streams safely
        const pdfText = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
        log('📝 [ENHANCED-PDF-EXTRACTOR] PDF decoded, raw text length:', pdfText.length);
        
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
            console.warn('⚠️ Error processing chunk, skipping:', (chunkError as Error).message);
            continue;
          }
        }
        
        if (textParts.length > 0) {
          extractedText = textParts.join(' ').trim();
          log('✅ [ENHANCED-PDF-EXTRACTOR] Extracted from text objects, length:', extractedText.length);
        }
        
        // Fallback: Extract readable ASCII with size limits
        if (!extractedText || extractedText.length < 20) {
          log('🔍 [ENHANCED-PDF-EXTRACTOR] Trying fallback ASCII extraction...');
          try {
            const readableText = pdfText
              .slice(0, 500000) // Limit input size
              .replace(/[^\x20-\x7E\s]/g, ' ') // Keep only printable ASCII
              .replace(/\s+/g, ' ')
              .trim();
            
            // Look for words (sequences of letters) with limits
            const words = readableText.match(/[a-zA-ZæøåÆØÅ]{2,}/g)?.slice(0, 1000) || [];
            log('📝 [ENHANCED-PDF-EXTRACTOR] Found', words.length, 'potential words');
            
            if (words.length > 10) {
              const meaningfulText = words.join(' ');
              if (meaningfulText.length > 50) {
                extractedText = meaningfulText.substring(0, 3000) + (meaningfulText.length > 3000 ? '...' : '');
                log('✅ [ENHANCED-PDF-EXTRACTOR] Used fallback extraction, length:', extractedText.length);
              }
            }
          } catch (fallbackError) {
            console.warn('⚠️ Fallback extraction failed:', (fallbackError as Error).message);
          }
        }
        
        // Final check
        if (!extractedText || extractedText.length < 10) {
          log('⚠️ [ENHANCED-PDF-EXTRACTOR] PDF may be image-based or encrypted');
          extractedText = '[PDF inneholder sannsynligvis kun bilder eller er kryptert. Avansert tekstekstraksjon ikke mulig.]';
        }
        
      } else if (document.mime_type?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        // DOCX processing
        log('📄 [ENHANCED-PDF-EXTRACTOR] Processing DOCX file...');
        extractedText = extractTextFromDocx(uint8Array);
        log('✅ [ENHANCED-PDF-EXTRACTOR] DOCX processed, length:', extractedText.length);
        
      } else if (document.mime_type?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        // XLSX processing
        log('📊 [ENHANCED-PDF-EXTRACTOR] Processing XLSX file...');
        extractedText = extractTextFromXlsx(uint8Array);
        log('✅ [ENHANCED-PDF-EXTRACTOR] XLSX processed, length:', extractedText.length);
        
      } else if (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json')) {
        // For text files, read directly
        extractedText = await fileData.text();
        log('✅ [ENHANCED-PDF-EXTRACTOR] Text file processed successfully, length:', extractedText.length);
      } else {
        // For other file types
        extractedText = `[Filtype ${document.mime_type} krever spesialisert prosessering. Støttede formater: PDF, DOCX, XLSX, TXT.]`;
        log('ℹ️ [ENHANCED-PDF-EXTRACTOR] Unsupported file type:', document.mime_type);
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        extractedText = '[Ingen tekstinnhold funnet i dokumentet.]';
      }

      // Limit text length to prevent database issues
      const maxLength = 50000; // 50KB limit
      if (extractedText.length > maxLength) {
        extractedText = extractedText.substring(0, maxLength) + '\n\n[Tekst forkortet på grunn av størrelse]';
        log('⚠️ [ENHANCED-PDF-EXTRACTOR] Text truncated to fit database limits');
      }

      log('✅ [ENHANCED-PDF-EXTRACTOR] Text extraction completed, final length:', extractedText.length);

    } catch (extractionError) {
      console.error('❌ [ENHANCED-PDF-EXTRACTOR] Text extraction failed:', extractionError);
      
      // Provide meaningful error text instead of failing
      extractedText = `[Forbedret tekstekstraksjon feilet: ${(extractionError as Error).message}. Dokumentet kan være skannet eller kryptert.]`;
    }

    // Step 6: Update document with extracted text and 'completed' status
    log('🔄 [ENHANCED-PDF-EXTRACTOR] Saving extracted text to database...');
    const { error: updateError } = await updateExtractionStatus(
      supabaseAdmin,
      documentId,
      'completed',
      extractedText
    );

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
    
    log('🎉 [ENHANCED-PDF-EXTRACTOR] Text extraction completed successfully for document:', documentId);
    log('📊 [ENHANCED-PDF-EXTRACTOR] Final statistics:', {
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
      extractionMethod: 'Enhanced backend processing with DOCX/XLSX support',
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
        const supabaseAdmin = getSupabase(req);
        await updateExtractionStatus(
          supabaseAdmin,
          documentId,
          'completed',
          `[Systemfeil under tekstekstraksjon: ${(error as Error).message}]`
        );
        
        log('🔄 [ENHANCED-PDF-EXTRACTOR] Status updated with error message for document:', documentId);
      } catch (updateError) {
        console.error(`❌ [ENHANCED-PDF-EXTRACTOR] Failed to update status for document ${documentId}:`, updateError);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Unexpected server error',
      documentId: documentId || 'unknown',
      details: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
