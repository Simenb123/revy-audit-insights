import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { message, context = 'general', variantName = 'support' } = requestBody;

    if (!message) {
      return new Response(JSON.stringify({ 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log('🔍 Starting knowledge search for:', message.substring(0, 50));

    // First, search for relevant knowledge articles
    let knowledgeContext = '';
    try {
      const knowledgeSearchUrl = 'https://fxelhfwaoizqyecikscu.supabase.co/functions/v1/knowledge-search';
      const knowledgeResponse = await fetch(knowledgeSearchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({ query: message }),
      });

      if (knowledgeResponse.ok) {
        const knowledgeData = await knowledgeResponse.json();
        console.log('📚 Knowledge search found:', knowledgeData.articles?.length || 0, 'articles');
        
        if (knowledgeData.articles && knowledgeData.articles.length > 0) {
          const relevantArticles = knowledgeData.articles.slice(0, 3);
          knowledgeContext = `\n\nRELEVANTE FAGARTIKLER:
Du har tilgang til følgende fagartikler som er relevante for spørsmålet:

${relevantArticles.map((article: any) => `
- Tittel: ${article.title}
  Sammendrag: ${article.summary || 'Ingen sammendrag'}
  ${article.content ? `Innhold: ${article.content.substring(0, 500)}...` : ''}
`).join('')}

VIKTIG: Når du refererer til disse artiklene, bruk lenkeformat: [Artikkelnavn](/fag/artikkel/${article.slug})`;
        }
      }
    } catch (error) {
      console.log('⚠️ Knowledge search failed:', error.message);
    }

    // Build system prompt
    const systemPrompt = `Du er AI-Revy, en AI-drevet revisjonsassistent som hjelper revisorer med faglige spørsmål, dokumentanalyse og revisjonsarbeid.

GRUNNLEGGENDE INSTRUKSJONER:
- Svar alltid på norsk (bokmål)
- Vær profesjonell, men vennlig og tilgjengelig
- Gi konkrete, praktiske råd basert på norske revisjonstandarder
- Referer til ISA-standarder når relevant
- Hvis du ikke er sikker på noe, si det tydelig

${knowledgeContext}

VIKTIG: Avslutt ALLTID svaret ditt med en linje som inneholder: "🏷️ **EMNER:** [liste over relevante norske emner adskilt med komma]"
Dette er påkrevd for at grensesnittet skal fungere korrekt.`;

    // Call OpenAI
    console.log('🤖 Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    console.log('✅ AI response generated successfully');

    return new Response(JSON.stringify({
      response: aiResponse,
      variantUsed: variantName,
      hasKnowledgeReferences: knowledgeContext.length > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in revy-ai-chat:', error);
    return new Response(JSON.stringify({
      error: 'Intern serverfeil. Prøv igjen senere.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});