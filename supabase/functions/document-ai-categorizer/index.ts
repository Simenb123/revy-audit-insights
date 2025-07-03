
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from '../test_deps.ts';
import { log } from "../_shared/log.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentCategorizationRequest {
  documentId: string;
  fileName: string;
  extractedText?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { documentId, fileName, extractedText }: DocumentCategorizationRequest = await req.json();

    log('Processing document categorization for:', fileName);

    // Get document categories for pattern matching
    const { data: categories, error: categoriesError } = await supabase
      .from('document_categories')
      .select('*');

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    // Simple filename-based categorization
    let bestMatch = null;
    let highestScore = 0;

    const lowerFileName = fileName.toLowerCase();

    for (const category of categories) {
      for (const pattern of category.expected_file_patterns) {
        if (lowerFileName.includes(pattern.toLowerCase())) {
          const score = pattern.length / fileName.length; // Longer patterns get higher scores
          if (score > highestScore) {
            highestScore = score;
            bestMatch = category;
          }
        }
      }
    }

    // If we have extracted text, we could do more sophisticated AI analysis here
    let aiAnalysis = '';
    if (extractedText && bestMatch) {
      aiAnalysis = `Dokument kategorisert som "${bestMatch.category_name}" basert på filnavn og innhold.`;
    } else if (bestMatch) {
      aiAnalysis = `Dokument kategorisert som "${bestMatch.category_name}" basert på filnavn.`;
    }

    // Update document with AI categorization results
    const updateData: any = {
      ai_analysis_summary: aiAnalysis,
      updated_at: new Date().toISOString()
    };

    if (bestMatch) {
      updateData.ai_suggested_category = bestMatch.category_name;
      updateData.ai_confidence_score = Math.min(0.95, 0.5 + highestScore); // Cap at 95%
      updateData.subject_area = bestMatch.subject_area;
      
      // If no manual category is set, use AI suggestion
      updateData.category = bestMatch.category_name;
    }

    const { error: updateError } = await supabase
      .from('client_documents_files')
      .update(updateData)
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    log('Document categorization completed for:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        category: bestMatch?.category_name,
        confidence: updateData.ai_confidence_score 
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in document-ai-categorizer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500 
      }
    );
  }
});
