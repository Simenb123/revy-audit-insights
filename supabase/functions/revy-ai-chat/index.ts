
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, context, variantName, image } = await req.json()
    console.log('🚀 AI-Revy chat function started')
    console.log('📝 Processing message:', message.substring(0, 50) + '...')
    if (image) {
      console.log('🖼️ Image provided for analysis')
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openaiApiKey) {
      console.error('❌ OpenAI API key is not configured')
      throw new Error('OpenAI API key is not configured');
    }

    // Log API key format for debugging (first 8 characters only)
    console.log('🔑 OpenAI API key format check:', openaiApiKey.substring(0, 8));

    console.log('🔍 Starting knowledge search for:', message.substring(0, 50));

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Search for relevant knowledge articles with timeout
    let knowledgeContext = ''
    let knowledgeArticles = []
    let hasKnowledgeReferences = false

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const knowledgeResponse = await fetch(`${supabaseUrl}/functions/v1/knowledge-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          limit: 5,
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
Du har tilgang til følgende fagartikler som kan være relevante for brukerens spørsmål:

${knowledgeData.articles.map(article => `
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
        console.log('⏰ Knowledge search timed out, proceeding without knowledge context')
      } else {
        console.log('⚠️ Knowledge search failed:', error.message)
      }
    }

    // Prepare context-aware system prompt
    const systemPrompt = `Du er AI-Revy, en ekspert revisjonsassistent for norske revisorer.

KONTEKST: ${context || 'general'}
VARIANT: ${variantName || 'support'}

${knowledgeContext}

RETNINGSLINJER:
- Svar alltid på norsk
- Vær konkret og praktisk
- Referer til ISA-standarder når relevant
- Bruk markdown for formatering (** for fet tekst, ## for overskrifter, - for lister)
- Lag lenker til fagartikler når du refererer til dem: [Artikkeltittel](/fag/artikkel/slug)
- Strukturer svar med overskrifter og punktlister for bedre lesbarhet
- Gi oppfølgingsspørsmål når det er relevant
- Vær profesjonell men vennlig
- Hvis du ikke vet noe, si det ærlig og foreslå hvor bruker kan finne mer informasjon
- Ved tekniske spørsmål, gi trinnvise instruksjoner med konkrete eksempler

${context === 'client-detail' ? 'Du hjelper med klient-spesifikke spørsmål og analyse.' : ''}
${context === 'documentation' ? 'Du fokuserer på dokumentanalyse og kvalitetssikring.' : ''}
${context === 'audit-actions' ? 'Du hjelper med revisjonshandlinger og ISA-standarder.' : ''}
${context === 'risk-assessment' ? 'Du fokuserer på risikovurdering og kontroller.' : ''}`;

    console.log('🤖 Calling OpenAI API...')

    // Prepare user message with optional image
    const userMessage: any = { role: 'user', content: message }
    if (image) {
      userMessage.content = [
        { type: 'text', text: message },
        { type: 'image_url', image_url: { url: image } }
      ]
    }

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
          userMessage
        ],
        max_tokens: 1200,
        temperature: 0.2,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    console.log('✅ AI response generated successfully:', aiResponse.substring(0, 100) + '...')

    // Generate suggested actions based on AI analysis
    const suggestedActions = generateSuggestedActions(message, aiResponse, image, context)

    return new Response(JSON.stringify({
      response: aiResponse,
      hasKnowledgeReferences,
      knowledgeArticles,
      context,
      suggestedActions
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

function generateSuggestedActions(message: string, aiResponse: string, image?: string, context?: string) {
  const actions = []
  
  // Text-based action detection
  if (message.toLowerCase().includes('inventar') || aiResponse.toLowerCase().includes('inventar')) {
    actions.push({
      type: 'add_to_inventory',
      label: 'Legg til i inventar',
      description: 'Registrer som inventarelement',
      icon: 'package'
    })
  }
  
  if (message.toLowerCase().includes('dokument') || aiResponse.toLowerCase().includes('dokument')) {
    actions.push({
      type: 'add_to_documents',
      label: 'Arkiver som dokument',
      description: 'Lagre i dokumentarkivet',
      icon: 'file-text'
    })
  }
  
  if (message.toLowerCase().includes('vin') || aiResponse.toLowerCase().includes('vin')) {
    actions.push({
      type: 'add_to_wine_cellar',
      label: 'Legg til i vinlager',
      description: 'Registrer i vinlageret',
      icon: 'wine'
    })
  }
  
  if (message.toLowerCase().includes('hyttebook') || message.toLowerCase().includes('aktivitet')) {
    actions.push({
      type: 'add_to_guestbook',
      label: 'Legg til i hytteboka',
      description: 'Opprett utkast til hytteboka',
      icon: 'book-open'
    })
  }
  
  if (message.toLowerCase().includes('sjekkliste') || aiResponse.toLowerCase().includes('sjekkliste')) {
    actions.push({
      type: 'add_to_checklist',
      label: 'Legg til i sjekkliste',
      description: 'Opprett sjekklistepunkt',
      icon: 'check-square'
    })
  }
  
  // Image-based action detection
  if (image) {
    // Always suggest inventory for images unless other specific categories detected
    if (!actions.some(a => a.type === 'add_to_inventory')) {
      actions.push({
        type: 'add_to_inventory',
        label: 'Registrer gjenstand',
        description: 'Legg til dette i inventaret',
        icon: 'package'
      })
    }
    
    // Always suggest document archiving for images
    if (!actions.some(a => a.type === 'add_to_documents')) {
      actions.push({
        type: 'add_to_documents',
        label: 'Arkiver bilde',
        description: 'Lagre som dokument',
        icon: 'image'
      })
    }
  }
  
  return actions
}
