
import { log } from "../_shared/log.ts"
import { callOpenAI } from "../_shared/openai.ts"
import type { AIReviVariantName } from "../../../src/constants/aiReviVariants.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  log('📄 Enhanced Document AI function started');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_text, file_name, client_id, variant_config } = await req.json();
    
    log('📝 Processing document analysis:', {
      fileName: file_name,
      clientId: client_id,
      hasText: !!document_text,
      textLength: document_text?.length || 0,
      hasVariant: !!variant_config
    });

    // Build analysis prompt based on variant
    let analysisPrompt = `Analyser følgende dokument og gi en detaljert vurdering:

DOKUMENT: ${file_name}
INNHOLD:
${document_text.substring(0, 4000)}${document_text.length > 4000 ? '...' : ''}

Gi meg følgende informasjon som JSON:
{
  "suggested_category": "kategori",
  "confidence_score": 0.95,
  "analysis_summary": "detaljert sammendrag",
  "suggested_subject_areas": ["område1", "område2"],
  "isa_standard_references": ["ISA 315", "ISA 330"],
  "revision_phase_relevance": {
    "planning": 0.8,
    "execution": 0.9,
    "completion": 0.3
  },
  "key_information": {
    "amounts": ["beløp funnet"],
    "dates": ["datoer funnet"],
    "entities": ["personer/selskaper"]
  },
  "risk_indicators": ["høy", "medium", "lav"],
  "audit_implications": "hva dette betyr for revisjonen"
}`;

    // Enhance prompt based on variant
    if ((variant_config as { name: AIReviVariantName } | undefined)?.name === 'methodology') {
      analysisPrompt += `\n\nSPESIELL FOKUS (Metodikk-ekspert):
- Identifiser relevante ISA-standarder
- Vurder metodiske tilnærminger
- Foreslå revisjonshandlinger basert på innholdet`;
    } else if ((variant_config as { name: AIReviVariantName } | undefined)?.name === 'guide') {
      analysisPrompt += `\n\nSPESIELL FOKUS (Klient-veileder):
- Hvordan påvirker dette den spesifikke klientens revisjon?
- Konkrete handlinger revisoren bør ta
- Prioritering basert på klientens risikoprofil`;
    }

    // Call OpenAI for analysis
    const data = await callOpenAI('chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du er en ekspert på dokumentanalyse for revisjon. Returner alltid gyldig JSON.'
        },
        { role: 'user', content: analysisPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    let analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis content from OpenAI');
    }

    // Try to parse JSON from response
    let analysisResult;
    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', parseError);
      // Fallback to basic analysis
      analysisResult = {
        suggested_category: 'Ukategorisert',
        confidence_score: 0.5,
        analysis_summary: analysisText.substring(0, 500),
        suggested_subject_areas: [],
        isa_standard_references: [],
        revision_phase_relevance: { planning: 0.5, execution: 0.5, completion: 0.3 },
        key_information: { amounts: [], dates: [], entities: [] },
        risk_indicators: ['medium'],
        audit_implications: 'Krever nærmere vurdering'
      };
    }

    log('✅ Document analysis completed:', {
      category: analysisResult.suggested_category,
      confidence: analysisResult.confidence_score,
      subjectAreas: analysisResult.suggested_subject_areas?.length || 0
    });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Document analysis error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      suggested_category: 'Ukategorisert',
      confidence_score: 0.3,
      analysis_summary: 'Automatisk analyse feilet'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
