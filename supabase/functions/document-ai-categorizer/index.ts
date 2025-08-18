import "../xhr.ts";
import { log } from "../_shared/log.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";
import { callOpenAI } from "../_shared/openai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentCategorizationRequest {
  documentId: string;
  fileName: string;
  extractedText?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabase(req);

    const { documentId, fileName, extractedText }: DocumentCategorizationRequest = await req.json();

    log('Processing document categorization for:', fileName);

    // Get document categories for pattern matching
    const { data: categories, error: categoriesError } = await supabase
      .from('document_categories')
      .select('*');

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    // Enhanced AI-based categorization
    let bestMatch = null;
    let highestScore = 0;
    let aiCategory = null;
    let aiConfidence = 0.5;

    const lowerFileName = fileName.toLowerCase();

    // First try AI categorization if we have good extracted text
    const hasGoodText = extractedText && 
                       extractedText.length > 50 && 
                       !extractedText.includes('PDF obj') &&
                       !extractedText.includes('FlateDecode');

    if (hasGoodText) {
      try {
        log('🤖 [DOCUMENT-AI-CATEGORIZER] Using AI for categorization...');
        
        const categoryNames = categories.map(c => c.category_name).join(', ');
        
        const data = await callOpenAI('chat/completions', {
          model: 'gpt-5-2025-08-07',
          messages: [
            {
              role: 'system',
              content: `Du er en AI-assistent som kategoriserer revisjonsdokumenter. 

              Analyser dokumentet og velg den mest passende kategorien fra listen nedenfor:
              ${categoryNames}

              Svar kun med følgende JSON-format:
              {"category": "kategori_navn", "confidence": 0.85}
              
              Confidence skal være mellom 0.0 og 1.0 basert på hvor sikker du er på kategoriseringen.`
            },
            {
              role: 'user',
              content: `Filnavn: ${fileName}\n\nInnhold:\n${extractedText.substring(0, 2000)}`
            }
          ],
          max_completion_tokens: 150,
        });

        const response = JSON.parse(data.choices[0].message.content);
        aiCategory = response.category;
        aiConfidence = Math.max(0, Math.min(1, response.confidence || 0.5));
        
        // Find the matching category object
        bestMatch = categories.find(c => c.category_name === aiCategory);
        if (bestMatch) {
          highestScore = aiConfidence;
        }
        
        log(`✅ [DOCUMENT-AI-CATEGORIZER] AI categorized as: ${aiCategory} (${Math.round(aiConfidence * 100)}%)`);
        
      } catch (aiError) {
        log(`⚠️ [DOCUMENT-AI-CATEGORIZER] AI categorization failed: ${aiError.message}`);
      }
    }

    // Fallback to filename-based categorization if AI didn't work
    if (!bestMatch) {
      log('📋 [DOCUMENT-AI-CATEGORIZER] Using filename-based categorization...');
      
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
    }

    // Generate analysis summary
    let aiAnalysis = '';
    if (bestMatch) {
      const method = aiCategory ? 'AI-analyse og innhold' : 'filnavn';
      aiAnalysis = `Dokument kategorisert som "${bestMatch.category_name}" basert på ${method}.`;
    } else {
      aiAnalysis = 'Kunne ikke kategorisere dokumentet automatisk. Krever manuell gjennomgang.';
    }

    // Update document with AI categorization results
    const updateData: any = {
      ai_analysis_summary: aiAnalysis,
      updated_at: new Date().toISOString()
    };

    if (bestMatch) {
      updateData.ai_suggested_category = bestMatch.category_name;
      updateData.ai_confidence_score = aiCategory ? aiConfidence : Math.min(0.95, 0.5 + highestScore); // Cap at 95%
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
