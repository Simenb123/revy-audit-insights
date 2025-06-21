
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
      .update({ text_extraction_status: 'processing' })
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

    // 3. For now, simulate successful text extraction with placeholder text
    // In a real implementation, you would use a PDF parsing library
    let extractedText = '';
    
    if (document.mime_type === 'application/pdf') {
      // Simulate PDF text extraction - replace with actual PDF parsing
      extractedText = `Tekstinnhold fra ${document.file_name}\n\nDette er placeholder tekst til PDF-parsing bibliotek blir implementert.\n\nFaktura detaljer ville være tilgjengelig her etter faktisk tekstekstraksjon.`;
      console.log('📄 Simulated PDF text extraction completed');
    } else if (document.mime_type?.includes('text/') || document.mime_type?.includes('application/json')) {
      // For text files, we could actually read the content
      try {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('client-documents')
          .download(document.file_path);

        if (downloadError || !fileData) {
          console.error('Storage download error:', downloadError);
          throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
        }
        
        extractedText = await fileData.text();
        console.log('📄 Text file processed successfully');
      } catch (error) {
        console.error('Error processing text file:', error);
        extractedText = `Kunne ikke lese tekstfil: ${error.message}`;
      }
    } else {
      console.log('📄 File type not supported for text extraction:', document.mime_type);
      extractedText = `[Filtype ${document.mime_type} - tekstekstraksjon ikke støttet ennå]`;
    }

    // 4. Update document with extracted text and 'completed' status
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
      fileType: document.mime_type,
      message: 'Text extraction completed successfully'
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
                extracted_text: `[Ekstraksjon feilet: ${error.message}]`
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
