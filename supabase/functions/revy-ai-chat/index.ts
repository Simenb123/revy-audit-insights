
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
    const { message, context, variantName, clientData, clientDocuments } = await req.json()
    console.log('🚀 AI-Revy chat function started')
    console.log('📝 Processing message:', message.substring(0, 50) + '...')
    console.log('📂 Client documents available:', clientDocuments?.length || 0)

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
    
    // Prepare client documents context
    let clientDocumentContext = ''
    if (clientDocuments && clientDocuments.length > 0) {
      const documentSummary = clientDocuments
        .filter(doc => doc.ai_analysis_summary || doc.extracted_text)
        .slice(0, 10) // Limit to 10 most relevant docs
        .map(doc => ({
          name: doc.file_name,
          category: doc.ai_suggested_category || doc.category || 'Ukategoriseret',
          summary: doc.ai_analysis_summary || (doc.extracted_text ? doc.extracted_text.substring(0, 200) + '...' : 'Ingen sammendrag'),
          confidence: doc.ai_confidence_score || 0,
          created: doc.created_at
        }))
      
      if (documentSummary.length > 0) {
        clientDocumentContext = `
KLIENTDOKUMENTER TILGJENGELIG:
Du har tilgang til følgende dokumenter for ${clientData?.company_name || 'klienten'}:

${documentSummary.map(doc => `
📄 **${doc.name}**
   Kategori: ${doc.category}
   Sammendrag: ${doc.summary}
   AI-sikkerhet: ${Math.round(doc.confidence * 100)}%
   Dato: ${new Date(doc.created).toLocaleDateString('no-NO')}
`).join('')}

VIKTIG: Referer til disse dokumentene når det er relevant for brukerens spørsmål. Bruk dokumentnavnene når du refererer til dem.`
      }
    }

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
KLIENT: ${clientData?.company_name || 'Ikke spesifisert'}

${knowledgeContext}

${clientDocumentContext}

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
- VIKTIG: Når du har tilgang til klientdokumenter, bruk dem aktivt i dine svar
- Referer til spesifikke dokumenter når det er relevant for spørsmålet
- Kombiner dokumentinnsikt med fagkunnskap for beste resultat

${context === 'client-detail' ? 'Du hjelper med klient-spesifikke spørsmål og analyse. Bruk tilgjengelige klientdokumenter aktivt i dine svar.' : ''}
${context === 'documentation' ? 'Du fokuserer på dokumentanalyse og kvalitetssikring. Analyser tilgjengelige dokumenter grundig.' : ''}
${context === 'audit-actions' ? 'Du hjelper med revisjonshandlinger og ISA-standarder. Knytt revisjonshandlinger til dokumentene.' : ''}
${context === 'risk-assessment' ? 'Du fokuserer på risikovurdering og kontroller. Bruk dokumenter til å identifisere risikoområder.' : ''}`;

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
          { role: 'user', content: message }
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

    return new Response(JSON.stringify({
      response: aiResponse,
      hasKnowledgeReferences,
      knowledgeArticles,
      context
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
