
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

    console.log('📄 Starting PDF text extraction for document:', documentId);

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
      console.error('Error updating status to processing:', statusError);
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

    console.log('📄 Document found:', document.file_name, 'at path:', document.file_path);

    // 3. Download and extract text from the file
    let extractedText = '';
    
    try {
      console.log('📥 Downloading file from storage...');
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('client-documents')
        .download(document.file_path);

      if (downloadError || !fileData) {
        console.error('Storage download error:', downloadError);
        throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
      }
      
      console.log('📄 File downloaded successfully, size:', fileData.size, 'bytes');

      if (document.mime_type === 'application/pdf') {
        console.log('📄 Processing PDF file...');
        
        // Convert blob to ArrayBuffer for PDF processing
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Simple PDF text extraction - look for text between "BT" and "ET" markers
        const pdfText = new TextDecoder().decode(uint8Array);
        const textMatches = pdfText.match(/BT\s*(.*?)\s*ET/gs);
        
        if (textMatches && textMatches.length > 0) {
          // Extract and clean text from PDF text objects
          const extractedParts = textMatches.map(match => {
            // Remove PDF operators and extract readable text
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
          
          extractedText = extractedParts.join('\n\n').trim();
          
          if (extractedText.length > 0) {
            console.log('✅ Successfully extracted text from PDF, length:', extractedText.length);
          } else {
            // Fallback: try to extract any readable text
            const readableText = pdfText
              .replace(/[^\x20-\x7E\s]/g, '') // Keep only printable ASCII
              .replace(/\s+/g, ' ')
              .trim();
            
            if (readableText.length > 50) {
              extractedText = readableText.substring(0, 2000) + (readableText.length > 2000 ? '...' : '');
              console.log('⚠️ Used fallback text extraction, length:', extractedText.length);
            } else {
              throw new Error('No readable text found in PDF');
            }
          }
        } else {
          throw new Error('No text content found in PDF structure');
        }
        
      } else if (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json')) {
        // For text files, read directly
        extractedText = await fileData.text();
        console.log('📄 Text file processed successfully, length:', extractedText.length);
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
        console.log('⚠️ Text truncated to fit database limits');
      }

    } catch (extractionError) {
      console.error('❌ Text extraction failed:', extractionError);
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
      console.error('Error saving extracted text:', updateError);
      throw new Error(`Failed to save extracted text: ${updateError.message}`);
    }
    
    console.log('✅ Text extraction completed successfully for document:', documentId);
    console.log('📊 Extracted text length:', extractedText.length, 'characters');
    
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
    console.error(`❌ Error in pdf-text-extractor for document ${documentId}:`, error);
    
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
            
            console.log('🔄 Status updated to failed for document:', documentId);
        } catch (e) {
            console.error(`Failed to update status to failed for document ${documentId}:`, e);
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
