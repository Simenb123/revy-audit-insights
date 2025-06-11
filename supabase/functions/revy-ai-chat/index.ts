
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { message, context, clientData, userRole } = await req.json();

    // Build system prompt based on context and user data
    const systemPrompt = buildSystemPrompt(context, clientData, userRole);

    console.log('Revy AI request:', { message, context, userRole });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    console.log('OpenAI response received');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in revy-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Beklager, jeg opplever tekniske problemer akkurat nå. Prøv igjen senere.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSystemPrompt(context: string, clientData: any, userRole: string): string {
  const basePrompt = `Du er Revy, en ekspert revisjonsassistent for norske revisorer. Du har dyp kunnskap om:
- Norsk regnskapslovgivning og standarder
- ISA (International Standards on Auditing)
- Risikovurdering og revisjonsmetodikk
- Regnskapsanalyse og kontroller
- Norsk skatterett og MVA

Du kommuniserer alltid på norsk og er vennlig, profesjonell og præsis.`;

  let contextualPrompt = '';

  switch (context) {
    case 'client-overview':
      contextualPrompt = `
Brukeren ser på klientoversikten. Du kan hjelpe med:
- Prioritering av klienter basert på risiko
- Planlegging av revisjonsaktiviteter
- Identifisering av viktige frister
- Vurdering av klientportefølje`;
      break;

    case 'client-detail':
      if (clientData) {
        contextualPrompt = `
Brukeren arbeider med klienten "${clientData.companyName}" (org.nr: ${clientData.orgNumber}).
Klientinformasjon:
- Bransje: ${clientData.industry}
- Fase: ${clientData.phase}
- Fremgang: ${clientData.progress}%
- Risikoområder: ${clientData.riskAreas?.map((r: any) => `${r.name} (${r.risk})`).join(', ') || 'Ikke definert'}

Du kan hjelpe med:
- Risikovurderinger for denne klienten
- Forslag til revisjonshandlinger
- Analyse av regnskapsdata
- Dokumentasjonskrav`;
      }
      break;

    case 'risk-assessment':
      contextualPrompt = `
Brukeren arbeider med risikovurdering. Du kan hjelpe med:
- Identifisering av risikoområder
- Vurdering av iboende risiko og kontrollrisiko
- Forslag til risikoreduserende tiltak
- ISA 315 og risikoresponser`;
      break;

    case 'documentation':
      contextualPrompt = `
Brukeren arbeider med dokumentasjon. Du kan hjelpe med:
- Krav til revisjonsdokumentasjon per ISA 230
- Struktur på arbeidspapirer
- Konklusjoner og vurderinger
- Partner review forberedelser`;
      break;

    case 'collaboration':
      contextualPrompt = `
Brukeren ser på samarbeidsverktøy. Du kan hjelpe med:
- Organisering av team og arbeidsoppgaver
- Kommunikasjon og koordinering
- Kvalitetssikring og review-prosesser
- Tidsplanlegging og ressursfordeling`;
      break;

    default:
      contextualPrompt = `
Du kan hjelpe med alle aspekter av revisjonsarbeid:
- Planlegging og gjennomføring av revisjoner
- Risikovurderinger og kontroller
- Regnskapsanalyse og testing
- Dokumentasjon og rapportering`;
  }

  const roleContext = userRole === 'partner' 
    ? 'Brukeren er partner og trenger høynivå strategisk veiledning.'
    : userRole === 'manager'
    ? 'Brukeren er manager og fokuserer på prosjektledelse og kvalitetssikring.'
    : 'Brukeren er revisor og trenger praktisk veiledning i daglig revisjonsarbeid.';

  return `${basePrompt}\n\n${contextualPrompt}\n\n${roleContext}\n\nSvar kort og praktisk, med konkrete forslag der det er relevant.`;
}
