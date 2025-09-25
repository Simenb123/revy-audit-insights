
import { log } from "../_shared/log.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voiceId } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    log('Generating speech for text length:', text.length)
    log('Using voice ID:', voiceId)

    // Use ElevenLabs for realistic Norwegian voices
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') || 'sk_b3e5ab505b9457d6db97a4093873157f3e6b9c96cb5b4f42'
    
    if (elevenLabsApiKey && voiceId) {
      try {
        // Try ElevenLabs first for better quality
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsApiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true
            }
          }),
        })

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer()
          log('ElevenLabs speech generated successfully')
          
          return new Response(audioBuffer, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'audio/mpeg',
            },
          })
        } else {
          log('ElevenLabs failed, falling back to OpenAI')
        }
      } catch (error) {
        log('ElevenLabs error, falling back to OpenAI:', (error as Error).message)
      }
    } else if (voiceId && !elevenLabsApiKey) {
      return new Response(JSON.stringify({ error: 'ElevenLabs API key not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (!voiceId && elevenLabsApiKey) {
      return new Response(JSON.stringify({ error: 'Invalid voice ID' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fallback to OpenAI TTS
    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3',
        }),
      })

      if (!openAIResponse.ok) {
        const error = await openAIResponse.json()
        return new Response(JSON.stringify({ error: error.error?.message || 'Failed to generate speech' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const audioBuffer = await openAIResponse.arrayBuffer()
      log('OpenAI speech generated successfully')

      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg',
        },
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
