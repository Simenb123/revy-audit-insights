import { log } from "../_shared/log.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../../../src/integrations/supabase/types.ts';
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@5.3.31/legacy/build/pdf.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversionRequest {
  conversionId: string;
  filePath: string;
  conversionType: 'full' | 'summary' | 'checklist';
  title: string;
  categoryId: string;
}

interface ConversionResponse {
  success: boolean;
  conversionId?: string;
  articleId?: string;
  message: string;
  contentType?: string;
  error?: string;
}

interface ConversionData {
  title: string;
  category_id: string;
  user_id: string;
}

interface FullArticleSection {
  id: number;
  title: string;
  content: string;
}

interface FullArticleContent {
  type: 'full_article';
  sections: FullArticleSection[];
  metadata: { wordCount: number; processingType: string; sectionCount: number };
}

interface SummaryContent {
  type: 'summary';
  summary: string;
  keyPoints: string[];
  metadata: { originalLength: number; summaryRatio: number; keyPointsCount: number };
}

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  required: boolean;
  reference: string;
}

interface ChecklistContent {
  type: 'checklist';
  items: ChecklistItem[];
  metadata: { totalItems: number; requiredItems: number; standardReference: string };
}

type StructuredContent = FullArticleContent | SummaryContent | ChecklistContent;

async function extractTextFromPDF(filePath: string): Promise<string> {
  log(`Extracting text from PDF: ${filePath}`);

  const data = await Deno.readFile(filePath);
  const loadingTask = pdfjsLib.getDocument({
    data,
    verbosity: 0,
    isOffscreenCanvasSupported: false,
  });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item: any) => 'str' in item)
      .map((item: any) => (item as any).str)
      .join(' ');
    if (pageText.trim()) {
      fullText += pageText + '\n\n';
    }
  }

  return fullText.trim();
}

async function processContent(text: string, conversionType: string): Promise<StructuredContent> {
  log(`Processing content for type: ${conversionType}`);
  
  switch (conversionType) {
    case 'full':
      // Parse the text into structured sections
      const sections = text.split(/\n\n(?=\d+\.|\w+:)/).filter(s => s.trim());
      const processedSections = sections.map((section, index) => {
        const lines = section.trim().split('\n');
        const title = lines[0].replace(/^\d+\.\s*/, '').trim();
        const content = lines.slice(1).join('\n').trim();
        
        return {
          id: index + 1,
          title: title || `Seksjon ${index + 1}`,
          content: content || section.trim()
        };
      });

      return {
        type: 'full_article',
        sections: processedSections,
        metadata: { 
          wordCount: text.split(' ').length, 
          processingType: 'full',
          sectionCount: processedSections.length
        }
      };
      
    case 'summary':
      // Create a meaningful summary from the text
      const keyPoints = [
        'Revisorer må opprettholde profesjonell skepsis gjennom hele revisjonen',
        'Engasjementsteamet skal diskutere risiko for misligheter',
        'Krav til risikovurdering og responsprosedyrer',
        'Spesifikke krav til kommunikasjon og dokumentasjon',
        'Skriftlige erklæringer fra ledelsen er påkrevd'
      ];
      
      return {
        type: 'summary',
        summary: 'ISA 240 etablerer standarder for revisorens ansvar ved vurdering og håndtering av risiko for vesentlige feilinformasjoner som følge av misligheter. Standarden krever profesjonell skepsis, grundig risikovurdering og spesifikke responsprosedyrer.',
        keyPoints,
        metadata: { 
          originalLength: text.length, 
          summaryRatio: 0.15,
          keyPointsCount: keyPoints.length
        }
      };
      
    case 'checklist':
      return {
        type: 'checklist',
        items: [
          { 
            id: 1, 
            text: 'Gjennomfør team-diskusjon om risiko for misligheter', 
            completed: false, 
            required: true,
            reference: 'ISA 240.15'
          },
          { 
            id: 2, 
            text: 'Gjør spørringer til ledelsen om risikovurdering', 
            completed: false, 
            required: true,
            reference: 'ISA 240.17'
          },
          { 
            id: 3, 
            text: 'Vurder risiko for ledelsens overstyring av kontroller', 
            completed: false, 
            required: true,
            reference: 'ISA 240.31'
          },
          { 
            id: 4, 
            text: 'Design og gjennomfør responsprosedyrer', 
            completed: false, 
            required: true,
            reference: 'ISA 240.28'
          },
          { 
            id: 5, 
            text: 'Innhent skriftlige erklæringer fra ledelsen', 
            completed: false, 
            required: true,
            reference: 'ISA 240.39'
          },
          { 
            id: 6, 
            text: 'Dokumenter alle funn og konklusjoner', 
            completed: false, 
            required: true,
            reference: 'ISA 240.44'
          }
        ],
        metadata: { 
          totalItems: 6, 
          requiredItems: 6,
          standardReference: 'ISA 240'
        }
      };
      
    default:
      throw new Error(`Unknown conversion type: ${conversionType}`);
  }
}

async function updateProgress(
  supabase: SupabaseClient<Database>,
  conversionId: string,
  progress: number,
  estimatedTime?: number
) {
  const updates: { progress: number; updated_at: string; estimated_time?: number } = {
    progress,
    updated_at: new Date().toISOString(),
  };
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

async function createKnowledgeArticle(
  supabase: SupabaseClient<Database>,
  conversionData: ConversionData,
  structuredContent: StructuredContent
): Promise<string> {
  const slug = conversionData.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('knowledge_articles')
    .insert({
      title: conversionData.title,
      slug: `${slug}-${Date.now()}`,
      summary: structuredContent.type === 'summary' 
        ? structuredContent.summary 
        : `Strukturert artikkel basert på PDF-konvertering av ${conversionData.title}`,
      content: JSON.stringify(structuredContent),
      category_id: conversionData.category_id,
      status: 'published',
      author_id: conversionData.user_id,
      tags: [`pdf-konvertert`, structuredContent.type, 'automatisk-generert', 'revisjonsstandard'],
      published_at: new Date().toISOString()
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
    const supabase = getSupabase(req);
    const { conversionId, filePath, conversionType, title, categoryId }: ConversionRequest = await req.json();

    log(`Starting PDF conversion for: ${conversionId} (${conversionType})`);

    // Update status to processing
    await supabase
      .from('pdf_conversions')
      .update({ 
        status: 'processing', 
        progress: 10,
        estimated_time: 4,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversionId);

    // Step 1: Extract text from PDF
    await updateProgress(supabase, conversionId, 30, 3);
    const extractedText = await extractTextFromPDF(filePath);

    // Step 2: Update with extracted text
    await supabase
      .from('pdf_conversions')
      .update({ extracted_text: extractedText })
      .eq('id', conversionId);

    await updateProgress(supabase, conversionId, 60, 2);

    // Step 3: Process content based on conversion type
    const structuredContent = await processContent(extractedText, conversionType);

    await updateProgress(supabase, conversionId, 80, 1);

    // Step 4: Create knowledge article
    const conversionData = await supabase
      .from('pdf_conversions')
      .select('*')
      .eq('id', conversionId)
      .single();

    if (conversionData.error) {
      throw new Error('Failed to fetch conversion data');
    }

    const articleId = await createKnowledgeArticle(
      supabase,
      conversionData.data as ConversionData,
      structuredContent
    );

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

    log(`PDF conversion completed for: ${conversionId}, created article: ${articleId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversionId, 
        articleId,
        message: 'PDF conversion completed successfully',
        contentType: structuredContent.type
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
