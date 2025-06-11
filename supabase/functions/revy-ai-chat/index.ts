
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

    const { message, context, clientData, userRole, userId, sessionId } = await req.json();
    const startTime = Date.now();

    // Fetch relevant knowledge articles based on context and message
    const knowledgeContext = await fetchRelevantKnowledge(message, context);
    
    // Fetch client-specific data if clientData is provided
    const clientContext = clientData ? await fetchClientContext(clientData.id) : null;

    // Build comprehensive system prompt
    const systemPrompt = await buildEnhancedSystemPrompt(
      context, 
      clientData, 
      userRole, 
      knowledgeContext, 
      clientContext
    );

    console.log('Enhanced Revy AI request:', { message, context, userRole, userId });

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    const usage = data.usage;
    const endTime = Date.now();

    // Log AI usage to database
    if (userId && usage) {
      await logAIUsage({
        userId,
        sessionId: sessionId || crypto.randomUUID(),
        model: 'gpt-4o-mini',
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        contextType: context,
        clientId: clientData?.id || null,
        responseTimeMs: endTime - startTime,
        requestType: 'chat'
      });
    }

    console.log('OpenAI response received with usage tracking');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context,
      usage: usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in revy-ai-chat function:', error);
    
    // Log error usage if possible
    if (req.json && req.json().userId) {
      try {
        const { userId, sessionId, context, clientData } = await req.json();
        await logAIUsage({
          userId,
          sessionId: sessionId || crypto.randomUUID(),
          model: 'gpt-4o-mini',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          contextType: context,
          clientId: clientData?.id || null,
          responseTimeMs: 0,
          requestType: 'chat',
          errorMessage: error.message
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Beklager, jeg opplever tekniske problemer akkurat nå. Prøv igjen senere.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchRelevantKnowledge(message: string, context: string) {
  try {
    // Search for relevant knowledge articles
    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select(`
        title,
        content,
        summary,
        tags
      `)
      .eq('status', 'published')
      .ilike('content', `%${extractKeywords(message)}%`)
      .limit(3);

    if (error) {
      console.error('Error fetching knowledge:', error);
      return null;
    }

    return articles?.length > 0 ? articles : null;
  } catch (error) {
    console.error('Knowledge fetch error:', error);
    return null;
  }
}

async function fetchClientContext(clientId: string) {
  try {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        risk_areas(*),
        client_audit_actions(
          name,
          description,
          status,
          phase,
          subject_area,
          risk_level
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client context:', clientError);
      return null;
    }

    return client;
  } catch (error) {
    console.error('Client context fetch error:', error);
    return null;
  }
}

function extractKeywords(message: string): string {
  // Simple keyword extraction - could be enhanced with NLP
  const keywords = message
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 3)
    .join('|');
  
  return keywords || message.substring(0, 50);
}

async function logAIUsage(params: {
  userId: string;
  sessionId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  contextType: string;
  clientId?: string | null;
  responseTimeMs: number;
  requestType: string;
  errorMessage?: string;
}) {
  try {
    // Calculate estimated cost using the database function
    const { data: costData, error: costError } = await supabase
      .rpc('calculate_ai_cost', {
        model_name: params.model,
        prompt_tokens: params.promptTokens,
        completion_tokens: params.completionTokens
      });

    if (costError) {
      console.error('Error calculating cost:', costError);
    }

    const estimatedCost = costData || 0;

    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: params.userId,
        session_id: params.sessionId,
        model: params.model,
        prompt_tokens: params.promptTokens,
        completion_tokens: params.completionTokens,
        total_tokens: params.totalTokens,
        estimated_cost_usd: estimatedCost,
        request_type: params.requestType,
        context_type: params.contextType,
        client_id: params.clientId,
        response_time_ms: params.responseTimeMs,
        error_message: params.errorMessage || null
      });

    if (error) {
      console.error('Error logging AI usage:', error);
    }
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
}

async function buildEnhancedSystemPrompt(
  context: string, 
  clientData: any, 
  userRole: string,
  knowledgeContext: any,
  clientContext: any
): Promise<string> {
  const basePrompt = `Du er Revy, en ekspert AI-revisjonsassistent for norske revisorer. Du har dyp kunnskap om:
- Norsk regnskapslovgivning og standarder (Regnskapsloven, NGRS, IFRS)
- ISA (International Standards on Auditing) - alle standarder
- Risikovurdering og revisjonsmetodikk
- Regnskapsanalyse og kontroller
- Norsk skatterett og MVA-regelverket
- Revisorlovgivning og etiske regler
- Praktisk revisjonsarbeid og dokumentasjon

Du kommuniserer alltid på norsk og er vennlig, profesjonell og præsis. Dine svar skal være konkrete og handlingsrettede.`;

  let contextualPrompt = '';
  let knowledgePrompt = '';
  let clientPrompt = '';

  // Add knowledge context
  if (knowledgeContext && knowledgeContext.length > 0) {
    knowledgePrompt = `\n\nRelevant fagstoff fra kunnskapsbasen:\n`;
    knowledgeContext.forEach((article: any, index: number) => {
      knowledgePrompt += `${index + 1}. ${article.title}\n${article.summary || article.content.substring(0, 200)}...\n\n`;
    });
    knowledgePrompt += `Bruk dette fagstoffet som referanse i dine svar når det er relevant.`;
  }

  // Add client context
  if (clientContext) {
    clientPrompt = `\n\nKlient-spesifikk informasjon:\n`;
    clientPrompt += `Klient: ${clientContext.company_name} (${clientContext.org_number})\n`;
    clientPrompt += `Bransje: ${clientContext.industry}\n`;
    clientPrompt += `Fase: ${clientContext.phase}\n`;
    clientPrompt += `Fremgang: ${clientContext.progress}%\n`;
    
    if (clientContext.risk_areas && clientContext.risk_areas.length > 0) {
      clientPrompt += `Risikoområder: ${clientContext.risk_areas.map((r: any) => `${r.name} (${r.risk})`).join(', ')}\n`;
    }

    if (clientContext.client_audit_actions && clientContext.client_audit_actions.length > 0) {
      const activeActions = clientContext.client_audit_actions.filter((a: any) => 
        a.status === 'in_progress' || a.status === 'not_started'
      );
      if (activeActions.length > 0) {
        clientPrompt += `Pågående/planlagte revisjonshandlinger:\n`;
        activeActions.slice(0, 5).forEach((action: any) => {
          clientPrompt += `- ${action.name} (${action.status}, ${action.risk_level} risiko)\n`;
        });
      }
    }
  }

  // Context-specific prompts
  switch (context) {
    case 'client-overview':
      contextualPrompt = `\nBrukeren ser på klientoversikten. Du kan hjelpe med:
- Prioritering av klienter basert på risiko og frister
- Planlegging av revisjonsaktiviteter og ressursfordeling
- Identifisering av viktige frister og deadlines
- Vurdering av klientportefølje og kapasitet
- Forslag til effektivisering av arbeidsflyt`;
      break;

    case 'client-detail':
      contextualPrompt = `\nBrukeren arbeider med klientdetaljer. Du kan hjelpe med:
- Dypere risikovurderinger for denne spesifikke klienten
- Detaljerte forslag til revisjonshandlinger basert på bransje og størrelse
- Analyse av regnskapsdata og nøkkeltall
- Spesifikke dokumentasjonskrav og kontroller
- Planlegging av feltarbeid og tidsestimater`;
      break;

    case 'risk-assessment':
      contextualPrompt = `\nBrukeren arbeider med risikovurdering. Du kan hjelpe med:
- Systematisk identifisering av risikoområder per ISA 315
- Vurdering av iboende risiko, kontrollrisiko og oppdagelsesrisiko  
- Forslag til risikoreduserende tiltak og kontroller
- ISA 330 og utforming av risikoresponser
- Materialitetsvurderinger og terskelverdi-setting`;
      break;

    case 'documentation':
      contextualPrompt = `\nBrukeren arbeider med dokumentasjon. Du kan hjelpe med:
- Krav til revisjonsdokumentasjon per ISA 230
- Strukturering av arbeidspapirer og elektronisk arkivering
- Konklusjoner og faglige vurderinger
- Forberedelse til partner review og kvalitetskontroll
- Dokumentasjon av vesentlige forhold og unntak`;
      break;

    case 'collaboration':
      contextualPrompt = `\nBrukeren fokuserer på samarbeid og teamarbeid. Du kan hjelpe med:
- Organisering av team og fordeling av arbeidsoppgaver
- Effektiv kommunikasjon og koordinering av revisjonsarbeid
- Kvalitetssikring og review-prosesser
- Tidsplanlegging, ressursfordeling og budsjettering
- Håndtering av teammøter og oppfølging`;
      break;

    default:
      contextualPrompt = `\nDu kan hjelpe med alle aspekter av revisjonsarbeid:
- Planlegging og gjennomføring av revisjoner per ISA-standarder
- Risikovurderinger og testing av kontroller
- Regnskapsanalyse og substansielle handlinger
- Dokumentasjon, rapportering og oppfølging
- Praktiske utfordringer i revisjonsarbeid`;
  }

  const roleContext = userRole === 'partner' 
    ? '\nBrukeren er partner og trenger høynivå strategisk veiledning om klientportefølje, risikostyring og forretningsutvikling.'
    : userRole === 'manager'
    ? '\nBrukeren er manager og fokuserer på prosjektledelse, kvalitetssikring og teamkoordinering.'
    : '\nBrukeren er revisor og trenger praktisk, detaljert veiledning i daglig revisjonsarbeid og tekniske spørsmål.';

  return `${basePrompt}${knowledgePrompt}${clientPrompt}${contextualPrompt}${roleContext}

VIKTIG: Gi alltid konkrete, handlingsrettede råd. Referer til relevante ISA-standarder når det er aktuelt. Hvis du bruker fagstoff fra kunnskapsbasen, nevn det kort. Hold svarene fokuserte og praktiske.`;
}
