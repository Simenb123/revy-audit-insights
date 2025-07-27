import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageAnalysis {
  type: 'inventory' | 'document' | 'wine' | 'activity' | 'receipt' | 'other';
  confidence: number;
  description: string;
  extractedText?: string;
  detectedObjects?: Array<{
    label: string;
    confidence: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, imageAnalysis, context, includeActions } = await req.json()
    console.log('🚀 Enhanced AI chat function started')
    console.log('📝 Processing message:', message?.substring(0, 50) + '...')
    console.log('🖼️ Has image analysis:', !!imageAnalysis)

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openaiApiKey) {
      console.error('❌ OpenAI API key is not configured')
      throw new Error('OpenAI API key is not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Build enhanced context with image analysis
    let enhancedContext = ''
    if (imageAnalysis) {
      enhancedContext += `
BILDEANALYSE:
- Type: ${imageAnalysis.type}
- Tillitsnivå: ${imageAnalysis.confidence}
- Beskrivelse: ${imageAnalysis.description}
${imageAnalysis.extractedText ? `- Uttrukket tekst: ${imageAnalysis.extractedText}` : ''}
${imageAnalysis.detectedObjects ? `- Gjenkjente objekter: ${imageAnalysis.detectedObjects.map(obj => obj.label).join(', ')}` : ''}

`
    }

    // Search for relevant knowledge articles if no image
    let knowledgeContext = ''
    let knowledgeArticles = []
    let hasKnowledgeReferences = false

    if (!imageAnalysis && message) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const knowledgeResponse = await fetch(`${supabaseUrl}/functions/v1/knowledge-search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: message,
            limit: 3,
            threshold: 0.1
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (knowledgeResponse.ok) {
          const knowledgeData = await knowledgeResponse.json()
          console.log('📚 Knowledge search found:', knowledgeData.articles?.length || 0, 'articles')
          
          if (knowledgeData.articles && knowledgeData.articles.length > 0) {
            hasKnowledgeReferences = true
            knowledgeArticles = knowledgeData.articles
            knowledgeContext = `
TILGJENGELIG FAGKUNNSKAP:
${knowledgeData.articles.map(article => `
- ${article.title}: ${article.summary || 'Ingen sammendrag'}
`).join('')}
`
          }
        }
      } catch (error) {
        console.log('⚠️ Knowledge search failed:', error.message)
      }
    }

    // Prepare enhanced system prompt
    const systemPrompt = `Du er AI-Revy, en smart assistent som hjelper med hytte- og hjemliv.

KONTEKST: ${context || 'general'}
${enhancedContext}
${knowledgeContext}

SPESIELLE EVNER:
- Bildeanalyse og gjenkjenning av objekter
- Forslag til handlinger basert på innhold
- Intelligent kategorisering av objekter og aktiviteter
- Proaktive forslag til organisering og vedlikehold

RETNINGSLINJER:
- Svar alltid på norsk
- Vær konkret og hjelpsom
- Bruk markdown for formatering (** for fet tekst, ## for overskrifter, - for lister)
- Strukturer svar med overskrifter og punktlister
- Gi praktiske forslag og handlinger
- Vær entusiastisk og positiv

SPESIFIKKE FUNKSJONER:
${imageAnalysis ? `
BILDEANALYSE:
- Du har analysert et bilde av type "${imageAnalysis.type}"
- Gi konkrete forslag basert på hva du ser
- Foreslå relevante handlinger som brukeren kan utføre
- Vær spesifikk om hva som kan legges til hvor (inventar, dokumenter, vinlager, hyttebok)
` : ''}

${includeActions ? `
HANDLINGSFORSLAG:
- Foreslå konkrete handlinger brukeren kan utføre
- Identifiser når noe bør legges til i sjekklister
- Vær proaktiv med organisering og vedlikehold
` : ''}

EKSEMPLER PÅ RESPONS:
- "Jeg ser dette er en [objekt]. Dette kan legges til i inventarlisten..."
- "Basert på det du beskriver, foreslår jeg å legge til et sjekklistepunkt..."
- "Dette dokumentet bør arkiveres under..."
`;

    console.log('🤖 Calling OpenAI API...')

    // Call OpenAI API
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
          { role: 'user', content: message || 'Kan du analysere dette bildet og foreslå handlinger?' }
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    console.log('✅ Enhanced AI response generated successfully')

    return new Response(JSON.stringify({
      response: aiResponse,
      hasKnowledgeReferences,
      knowledgeArticles,
      imageAnalysis,
      context,
      suggestedActions: [] // Can be enhanced later
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      response: 'Beklager, jeg har tekniske problemer akkurat nå. Prøv igjen om litt.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})