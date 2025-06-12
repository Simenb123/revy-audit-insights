
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ConversionRequest {
  conversionId: string;
  filePath: string;
  conversionType: 'full' | 'summary' | 'checklist';
  title: string;
  categoryId: string;
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  // Simulate PDF text extraction - in production, use a proper PDF parsing library
  console.log(`Extracting text from PDF: ${filePath}`);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock extracted text
  return `Extracted text from ${filePath}. This would contain the actual PDF content in a real implementation.`;
}

async function processContent(text: string, conversionType: string): Promise<any> {
  console.log(`Processing content for type: ${conversionType}`);
  
  switch (conversionType) {
    case 'full':
      return {
        type: 'full_article',
        sections: [
          { title: 'Innledning', content: 'Behandler grunnleggende prinsipper...' },
          { title: 'Hovedinnhold', content: text.substring(0, 500) + '...' },
          { title: 'Konklusjon', content: 'Oppsummering av viktige punkter...' }
        ],
        metadata: { wordCount: text.length, processingType: 'full' }
      };
    case 'summary':
      return {
        type: 'summary',
        keyPoints: [
          'Viktigste punkt fra dokumentet',
          'Relevante bestemmelser og paragrafer',
          'Praktiske implikasjoner'
        ],
        summary: text.substring(0, 200) + '...',
        metadata: { originalLength: text.length, summaryRatio: 0.1 }
      };
    case 'checklist':
      return {
        type: 'checklist',
        items: [
          { id: 1, text: 'Kontroller dokumentasjon', completed: false, required: true },
          { id: 2, text: 'Verifiser beregninger', completed: false, required: true },
          { id: 3, text: 'Gjennomgå sammendrag', completed: false, required: false }
        ],
        metadata: { totalItems: 3, requiredItems: 2 }
      };
    default:
      throw new Error(`Unknown conversion type: ${conversionType}`);
  }
}

async function updateProgress(conversionId: string, progress: number, estimatedTime?: number) {
  const updates: any = { progress, updated_at: new Date().toISOString() };
  if (estimatedTime !== undefined) {
    updates.estimated_time = estimatedTime;
  }

  const { error } = await supabase
    .from('pdf_conversions')
    .update(updates)
    .eq('id', conversionId);

  if (error) {
    console.error('Error updating progress:', error);
  }
}

async function createKnowledgeArticle(conversionData: any, structuredContent: any): Promise<string> {
  const slug = conversionData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('knowledge_articles')
    .insert({
      title: conversionData.title,
      slug: `${slug}-${Date.now()}`,
      summary: structuredContent.type === 'summary' ? structuredContent.summary : `Strukturert artikkel basert på PDF-konvertering`,
      content: JSON.stringify(structuredContent),
      category_id: conversionData.category_id,
      status: 'published',
      author_id: conversionData.user_id,
      tags: [`pdf-konvertert`, structuredContent.type, 'automatisk-generert']
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create knowledge article: ${error.message}`);
  }

  return data.id;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversionId, filePath, conversionType, title, categoryId }: ConversionRequest = await req.json();

    console.log(`Starting PDF conversion for: ${conversionId}`);

    // Update status to processing
    await supabase
      .from('pdf_conversions')
      .update({ 
        status: 'processing', 
        progress: 10,
        estimated_time: 5,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversionId);

    // Step 1: Extract text from PDF
    await updateProgress(conversionId, 30, 4);
    const extractedText = await extractTextFromPDF(filePath);

    // Step 2: Update with extracted text
    await supabase
      .from('pdf_conversions')
      .update({ extracted_text: extractedText })
      .eq('id', conversionId);

    await updateProgress(conversionId, 60, 2);

    // Step 3: Process content based on conversion type
    const structuredContent = await processContent(extractedText, conversionType);

    await updateProgress(conversionId, 80, 1);

    // Step 4: Create knowledge article
    const conversionData = await supabase
      .from('pdf_conversions')
      .select('*')
      .eq('id', conversionId)
      .single();

    if (conversionData.error) {
      throw new Error('Failed to fetch conversion data');
    }

    const articleId = await createKnowledgeArticle(conversionData.data, structuredContent);

    // Step 5: Complete conversion
    await supabase
      .from('pdf_conversions')
      .update({
        status: 'completed',
        progress: 100,
        estimated_time: 0,
        structured_content: structuredContent,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversionId);

    console.log(`PDF conversion completed for: ${conversionId}, created article: ${articleId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversionId, 
        articleId,
        message: 'PDF conversion completed successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('PDF conversion error:', error);

    // Update conversion status to failed if we have the conversionId
    try {
      const body = await req.clone().json();
      if (body.conversionId) {
        await supabase
          .from('pdf_conversions')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', body.conversionId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
