
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Use the legacy build which is often more compatible with server-side environments
import * as pdfjs from 'https://unpkg.com/pdfjs-dist@4.4.168/legacy/build/pdf.mjs';

// Set up the PDF.js worker from the legacy build.
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/legacy/build/pdf.worker.mjs';

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
    // Parse body once to avoid "Body already consumed" error
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

    // 1. Set status to 'processing' - using correct table
    const { error: statusError } = await supabaseAdmin
      .from('client_documents_files')
      .update({ text_extraction_status: 'processing' })
      .eq('id', documentId);

    if (statusError) {
      console.error('Error updating status to processing:', statusError);
    }

    // 2. Fetch document to get file_path - using correct table
    const { data: document, error: docError } = await supabaseAdmin
      .from('client_documents_files')
      .select('file_path, file_name, mime_type')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Failed to fetch document: ${docError?.message || 'Not found'}`);
    }

    console.log('📄 Document found:', document.file_name, 'at path:', document.file_path);

    // 3. Download file from storage - using correct bucket
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('client-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
    }
    
    console.log('📄 File downloaded successfully, size:', fileData.size);

    // 4. Extract text using PDF.js only for PDF files
    let extractedText = '';
    let extractedData = null;

    if (document.mime_type === 'application/pdf') {
      try {
        const pdf = await pdfjs.getDocument(await fileData.arrayBuffer()).promise;
        const textPages = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          textPages.push({ page: i, content: pageText });
        }
        
        extractedData = textPages;
        extractedText = textPages.map(p => p.content).join('\n');
        console.log('📄 PDF text extracted successfully, total pages:', pdf.numPages);
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        throw new Error(`PDF text extraction failed: ${pdfError.message}`);
      }
    } else if (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json')) {
      // Handle text files
      extractedText = await fileData.text();
      extractedData = { content: extractedText, type: 'text' };
      console.log('📄 Text file processed successfully');
    } else {
      console.log('📄 File type not supported for text extraction:', document.mime_type);
      extractedText = `[File type ${document.mime_type} - content extraction not supported]`;
      extractedData = { error: 'Unsupported file type for text extraction' };
    }

    // 5. Update document with extracted text and 'completed' status
    const { error: updateError } = await supabaseAdmin
      .from('client_documents_files')
      .update({
        extracted_text: extractedText,
        text_extraction_status: 'completed',
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error saving extracted text:', updateError);
      throw new Error(`Failed to save extracted text: ${updateError.message}`);
    }
    
    console.log('✅ Text extraction completed successfully for document:', documentId);
    
    return new Response(JSON.stringify({ 
      success: true, 
      documentId,
      textLength: extractedText.length,
      fileType: document.mime_type
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
                extracted_text: `[Extraction failed: ${error.message}]`
            }).eq('id', documentId);
            
            console.log('🔄 Status updated to failed for document:', documentId);
        } catch (e) {
            console.error(`Failed to update status to failed for document ${documentId}:`, e);
        }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      documentId: documentId || 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
