import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');

    const { agent, question, context } = await req.json();

    // TODO: integrate with knowledge base when needed
    // For now, we'll use basic context from agent configuration
    const knowledgeSnippet = '';

    const systemPrompt = [
      `Du er ${agent.name}.`,
      agent.systemPrompt,
      context?.clientId ? `Klient-ID: ${context.clientId}` : '',
      context?.documentContext ? `Dokument-kontekst: ${context.documentContext}` : '',
      agent?.dataScopes?.length ? `Datasett-tilgang: ${agent.dataScopes.join(', ')}` : '',
      agent?.dataTopics?.length ? `Tema: ${agent.dataTopics.join(', ')}` : '',
      agent?.allowedSources?.length ? `Tillatte kilder: ${agent.allowedSources.join(', ')}` : '',
      knowledgeSnippet ? `Kildestøtte:\n${knowledgeSnippet}` : '',
      `Svar kortfattet på norsk.`,
    ].filter(Boolean).join('\n\n');

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OPENAI_API_KEY mangler');

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ];
    
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: agent.model || 'gpt-5-mini-2025-08-07', 
        messages, 
        max_completion_tokens: 500 
      }),
    });
    
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error?.message || 'OpenAI feil');

    const answer = data.choices?.[0]?.message?.content || '';

    // Sources: use allowedSources if set, otherwise show datascope
    const sources = Array.isArray(agent?.allowedSources) && agent.allowedSources.length
      ? agent.allowedSources
      : (Array.isArray(agent?.dataScopes) ? agent.dataScopes.map((x: string) => `datascope:${x}`) : []);

    return new Response(JSON.stringify({ answer, sources }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error('revy-role-test error', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});