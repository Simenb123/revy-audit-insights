import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model, prompt } = await req.json();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OpenAI API-nøkkel ikke konfigurert');
    }

    console.log('Testing OpenAI model:', { model, promptLength: prompt?.length || 0 });

    // Bygg en minimal melding for testing
    const messages = [
      { role: 'user', content: prompt || 'Test message - please respond with "OK"' }
    ];

    const requestBody = {
      model: model || 'gpt-4o-mini',
      messages,
      max_completion_tokens: 50, // Kort svar for testing
    };

    // For legacy models, use max_tokens instead
    if (model?.includes('gpt-4o')) {
      delete requestBody.max_completion_tokens;
      requestBody.max_tokens = 50;
    }

    console.log('OpenAI request body:', JSON.stringify(requestBody));

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await resp.json();
    
    console.log('OpenAI response:', {
      status: resp.status,
      ok: resp.ok,
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      content: data.choices?.[0]?.message?.content || null,
      error: data.error || null
    });

    // Returner hele responsen tilbake til klienten for inspeksjon
    return new Response(JSON.stringify({
      success: resp.ok,
      status: resp.status,
      model: model,
      response: data,
      content: data.choices?.[0]?.message?.content || null,
      error: data.error || null
    }), {
      status: 200, // Alltid 200 så vi kan se hva som skjedde
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Model test error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Se edge function logs for mer info'
    }), {
      status: 200, // Gi 200 så frontend kan se feilen
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});