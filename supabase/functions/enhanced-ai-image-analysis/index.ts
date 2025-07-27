import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageData, context } = await req.json()
    console.log('🖼️ Image analysis function started')
    console.log('📊 Context:', context)

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Extract base64 data from data URL
    const base64Image = imageData.split(',')[1] || imageData

    console.log('🔍 Analyzing image with OpenAI Vision...')

    // Call OpenAI Vision API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en ekspert på bildeanalyse for hjem- og hyttebruk. Analyser bildet og kategoriser det.

KATEGORIER:
- inventory: Møbler, utstyr, verktøy, elektronikk som kan inventariseres
- document: Dokumenter, kvitteringer, papirer, fakturaer
- wine: Vinflasker, alkohol, drikkevarer for lager
- activity: Aktiviteter, opplevelser, hendelser for hyttebok
- receipt: Kvitteringer, regninger, bilag
- other: Alt annet

Svar BARE med et JSON-objekt i dette formatet:
{
  "type": "kategori",
  "confidence": 0.0-1.0,
  "description": "kort beskrivelse på norsk",
  "extractedText": "eventuell tekst i bildet",
  "detectedObjects": [{"label": "objekt", "confidence": 0.0-1.0}]
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyser dette bildet og kategoriser det for en norsk hytte/hjem-app.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI Vision API error:', errorText)
      throw new Error(`OpenAI Vision API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const analysisText = openaiData.choices[0].message.content

    console.log('🔍 Raw analysis response:', analysisText)

    // Parse JSON response
    let analysis
    try {
      // Extract JSON from response (remove any markdown formatting)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : analysisText
      analysis = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('❌ Failed to parse analysis JSON:', parseError)
      // Fallback analysis
      analysis = {
        type: 'other',
        confidence: 0.5,
        description: 'Kunne ikke analysere bildet automatisk',
        extractedText: '',
        detectedObjects: []
      }
    }

    console.log('✅ Image analysis completed:', analysis)

    return new Response(JSON.stringify({
      analysis,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Image analysis error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      analysis: {
        type: 'other',
        confidence: 0.0,
        description: 'Feil ved analyse av bilde',
        extractedText: '',
        detectedObjects: []
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})