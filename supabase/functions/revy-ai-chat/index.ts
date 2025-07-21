
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
    console.log('🚀 AI-Revy chat function started');
    
    const requestBody = await req.json();
    const { message, context = 'general', variantName = 'support' } = requestBody;

    if (!message) {
      console.log('❌ No message provided');
      return new Response(JSON.stringify({ 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Processing message:', message.substring(0, 50) + '...');

    // Check for OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured');
      throw new Error('OpenAI API key is not configured');
    }

    // Log API key format for debugging (first 8 characters only)
    console.log('🔑 OpenAI API key format check:', openaiApiKey.substring(0, 8));

    console.log('🔍 Starting knowledge search for:', message.substring(0, 50));

    // Search for relevant knowledge articles with timeout
    let knowledgeContext = '';
    try {
      const knowledgeSearchUrl = 'https://fxelhfwaoizqyecikscu.supabase.co/functions/v1/knowledge-search';
      
      // Create AbortController for timeout handling
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 15000); // 15 second timeout
      
      const knowledgeResponse = await fetch(knowledgeSearchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({ query: message }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

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
  ${article.slug ? `Link: [${article.title}](/fag/artikkel/${article.slug})` : ''}
`).join('')}

VIKTIG: Når du refererer til disse artiklene, bruk lenkeformat som vist over.`;
        }
      } else {
        console.log('⚠️ Knowledge search responded with status:', knowledgeResponse.status);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Knowledge search timed out after 15 seconds');
      } else {
        console.log('⚠️ Knowledge search failed:', error.message);
      }
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

    // Call OpenAI with timeout handling
    console.log('🤖 Calling OpenAI API...');
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
    
    try {
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
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('❌ OpenAI API error:', openaiResponse.status, errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      const aiResponse = openaiData.choices[0].message.content;

      console.log('✅ AI response generated successfully:', aiResponse.substring(0, 100) + '...');

      return new Response(JSON.stringify({
        response: aiResponse,
        variantUsed: variantName,
        hasKnowledgeReferences: knowledgeContext.length > 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('⏰ OpenAI API request timed out');
        throw new Error('AI request timed out. Please try again.');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('💥 Error in revy-ai-chat:', error);
    
    // Provide helpful error message based on error type
    let errorMessage = 'Intern serverfeil. Prøv igjen senere.';
    let statusCode = 500;
    
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      errorMessage = 'Forespørselen tok for lang tid. Prøv igjen om litt.';
      statusCode = 408;
    } else if (error.message.includes('OpenAI')) {
      errorMessage = 'AI-tjenesten er midlertidig utilgjengelig. Prøv igjen senere.';
      statusCode = 503;
    } else if (error.message.includes('not configured')) {
      errorMessage = 'AI-tjenesten er ikke konfigurert riktig.';
      statusCode = 503;
    }
    
    return new Response(JSON.stringify({
      error: errorMessage,
      details: error.message
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
