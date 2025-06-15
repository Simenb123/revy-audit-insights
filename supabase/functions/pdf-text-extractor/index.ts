
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

    // Use the Service Role Key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Set status to 'processing'
    await supabaseAdmin
      .from('pdf_documents')
      .update({ text_extraction_status: 'processing' })
      .eq('id', documentId);

    // 2. Fetch document to get file_path
    const { data: document, error: docError } = await supabaseAdmin
      .from('pdf_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Failed to fetch document: ${docError?.message || 'Not found'}`);
    }

    // 3. Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('pdf-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
    }
    
    // 4. Extract text using PDF.js
    const pdf = await pdfjs.getDocument(await fileData.arrayBuffer()).promise;
    const extractedText = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      extractedText.push({ page: i, content: pageText });
    }

    // 5. Update document with extracted text and 'completed' status
    const { error: updateError } = await supabaseAdmin
      .from('pdf_documents')
      .update({
        extracted_text: extractedText,
        text_extraction_status: 'completed',
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to save extracted text: ${updateError.message}`);
    }
    
    return new Response(JSON.stringify({ success: true, documentId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Error in pdf-text-extractor for document ${documentId}:`, error);
    
    // Attempt to update the status to 'failed' if a documentId was parsed
    if (documentId) {
        try {
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );
            await supabaseAdmin.from('pdf_documents').update({
                text_extraction_status: 'failed',
                extracted_text: { error: error.message } // Store error message
            }).eq('id', documentId);
        } catch (e) {
            console.error(`Failed to update status to failed for document ${documentId}:`, e);
        }
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

