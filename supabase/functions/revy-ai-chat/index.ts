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

  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error('❌ Invalid JSON body:', e.message);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('🤖 Revy AI Chat function started');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const { message, context, clientData, userRole, userId, sessionId } = body;
    console.log('📝 Request received:', { 
      message: message.substring(0, 50) + '...', 
      context, 
      userRole, 
      userId: userId?.substring(0, 8) + '...' || 'guest',
      hasClientData: !!clientData 
    });

    // Handle guest mode gracefully
    const isGuestMode = !userId;
    if (isGuestMode) {
      console.log('👤 Guest mode detected - providing limited functionality');
    }

    const startTime = Date.now();

    // Enhanced context building with guest mode support
    const enhancedContext = await buildEnhancedContext(
      message, 
      context, 
      isGuestMode ? null : clientData
    );
    console.log('🧠 Enhanced context built:', { 
      knowledgeArticleCount: enhancedContext.knowledge?.length || 0,
      hasClientContext: !!enhancedContext.clientContext,
      isGuestMode
    });

    // Select appropriate model based on complexity (simpler for guests)
    const model = selectOptimalModel(message, context, isGuestMode);
    console.log('🎯 Selected model:', model);

    const systemPrompt = buildIntelligentSystemPrompt(
      context, 
      isGuestMode ? null : clientData, 
      userRole, 
      enhancedContext,
      isGuestMode
    );

    console.log('🚀 Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: isGuestMode ? 0.5 : 0.7, // More consistent responses for guests
        max_tokens: isGuestMode ? 500 : (model === 'gpt-4o' ? 2000 : 1000),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    const usage = data.usage;
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('✅ AI response generated:', { 
      responseLength: aiResponse?.length,
      usage,
      responseTime: `${responseTime}ms`,
      isGuestMode
    });

    // Enhanced usage logging (only for authenticated users)
    if (userId && usage) {
      try {
        await logAIUsageEnhanced({
          userId,
          sessionId: sessionId || crypto.randomUUID(),
          model,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          contextType: context,
          clientId: clientData?.id || null,
          responseTimeMs: responseTime,
          requestType: 'chat'
        });
        console.log('📊 Usage logged successfully');
      } catch (logError) {
        console.error('⚠️ Failed to log usage (non-critical):', logError);
      }
    } else if (isGuestMode) {
      console.log('📊 Guest mode - usage not logged');
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context,
      usage: usage,
      model: model,
      responseTime: responseTime,
      isGuestMode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in revy-ai-chat function:', error);
    
    // Enhanced error logging for authenticated users
    try {
      const { userId, sessionId, context, clientData } = body;
      if (userId) {
        await logAIUsageEnhanced({
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
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    // Intelligent fallback responses based on context and authentication
    const fallbackResponse = getIntelligentFallback(body);

    return new Response(JSON.stringify({ 
      error: error.message,
      response: fallbackResponse,
      isError: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// --- New knowledge search logic ---

const extractSearchTerms = (query: string, context: string): string[] => {
  const terms = new Set<string>();

  // Add query terms, filtering out small words
  query.toLowerCase().split(/\s+/).filter(term => term.length > 2).forEach(term => terms.add(term));

  // Extract ISA standards
  const isaPattern = /isa\s*\d{3}/gi;
  const isaMatches = query.match(isaPattern);
  if (isaMatches) {
    isaMatches.forEach(match => terms.add(match.toUpperCase().replace(/\s+/g, ' ')));
  }

  // Add context-specific terms
  const contextTerms: Record<string, string[]> = {
    'risk-assessment': ['risiko', 'vurdering', 'materialitet', 'vesentlighet', 'kontrollmiljø'],
    'client-detail': ['klient', 'selskap', 'bransje', 'regnskap', 'nøkkeltall'],
    'documentation': ['dokumentasjon', 'arbeidspapir', 'bevis', 'ISA 230', 'konklusjon'],
    'audit-actions': ['handlinger', 'prosedyrer', 'testing', 'kontroll', 'substans'],
  };

  if (contextTerms[context]) {
    contextTerms[context].forEach(term => terms.add(term));
  }

  return [...terms];
};

const scoreArticleRelevance = (articles: any[], searchTerms: string[]): any[] => {
  return articles
    .map(article => {
      let score = 0;
      const matchedTerms = new Set<string>();
      const searchText = `${article.title} ${article.summary || ''} ${article.content} ${(article.tags || []).join(' ')}`.toLowerCase();

      searchTerms.forEach(term => {
        const termPattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const termCount = (searchText.match(termPattern) || []).length;
        if (termCount > 0) {
          let weight = term.length > 4 ? 2 : 1;
          if (term.toLowerCase().startsWith('isa')) weight = 10;
          score += termCount * weight;
          matchedTerms.add(term);
        }
      });

      searchTerms.forEach(term => {
        if (article.title.toLowerCase().includes(term.toLowerCase())) {
          score += 15;
        }
      });
      
      if (article.tags && Array.isArray(article.tags)) {
        searchTerms.forEach(term => {
            if (article.tags.some((tag: string) => typeof tag === 'string' && tag.toLowerCase().includes(term.toLowerCase()))) {
                score += 5;
            }
        });
      }

      score += Math.log1p(article.view_count || 0);

      return {
        ...article,
        relevanceScore: score,
        matchedTerms: [...matchedTerms]
      };
    })
    .filter(result => result.relevanceScore > 2)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

async function searchRelevantKnowledge(message: string, context: string) {
  try {
    const searchTerms = extractSearchTerms(message, context);
    if (searchTerms.length === 0) return null;

    console.log(`🔎 Knowledge search terms: ${searchTerms.join(', ')}`);
    
    const orFilter = searchTerms.flatMap(term => [
        `title.ilike.%${term}%`,
        `content.ilike.%${term}%`,
        `summary.ilike.%${term}%`,
        `tags.cs.{${term}}`
    ]).join(',');

    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select('title, content, summary, tags, view_count, slug, published_at, created_at')
      .eq('status', 'published')
      .or(orFilter)
      .limit(15);

    if (error) {
      console.error('Error fetching knowledge articles:', error);
      return null;
    }
    
    if (!articles || articles.length === 0) {
        console.log('🧐 No initial articles found for terms.');
        return null;
    }

    const scoredArticles = scoreArticleRelevance(articles, searchTerms);
    
    console.log(`✅ Found ${scoredArticles.length} relevant articles after scoring.`);

    return scoredArticles.length > 0 ? scoredArticles.slice(0, 5) : null;
  } catch (error) {
    console.error('Knowledge search error:', error);
    return null;
  }
}

// Enhanced client context with risk analysis
async function fetchEnhancedClientContext(clientId: string) {
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
          risk_level,
          due_date,
          assigned_to,
          progress: (case when status = 'completed' then 100 else 50 end)
        ),
        client_documents(
          type,
          status,
          due_date
        ),
        trial_balances(
          period_end_date,
          closing_balance,
          client_account_id
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

// Intelligent keyword extraction
function extractIntelligentKeywords(message: string, context: string): string[] {
  const revisionTerms = ['revisjon', 'audit', 'kontroll', 'risikovurdering', 'materialitet', 'testing', 'verifisering'];
  const accountingTerms = ['regnskap', 'balanse', 'resultat', 'kontroller', 'transaksjoner', 'kontoplan'];
  const contextTerms = {
    'risk-assessment': ['risiko', 'vurdering', 'materialitet', 'kontrollrisiko'],
    'documentation': ['dokumentasjon', 'arbeidspapirer', 'bevis', 'konklusjon'],
    'client-detail': ['klient', 'bransje', 'nøkkeltall', 'analyse']
  };

  const keywords: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Add context-specific terms
  if (contextTerms[context as keyof typeof contextTerms]) {
    keywords.push(...contextTerms[context as keyof typeof contextTerms]);
  }
  
  // Add revision terms if relevant
  if (revisionTerms.some(term => lowerMessage.includes(term))) {
    keywords.push(...revisionTerms.filter(term => lowerMessage.includes(term)));
  }
  
  // Add accounting terms if relevant
  if (accountingTerms.some(term => lowerMessage.includes(term))) {
    keywords.push(...accountingTerms.filter(term => lowerMessage.includes(term)));
  }
  
  // Extract key words from message (simple approach)
  const words = lowerMessage.split(/\s+/).filter(word => word.length > 3);
  keywords.push(...words.slice(0, 3));

  return [...new Set(keywords)]; // Remove duplicates
}

// Optimal model selection based on complexity
function selectOptimalModel(message: string, context: string, isGuestMode = false): string {
  // Always use mini model for guests to reduce costs
  if (isGuestMode) {
    return 'gpt-4o-mini';
  }

  const complexContexts = ['risk-assessment', 'documentation', 'client-detail'];
  const longMessage = message.length > 200;
  const complexTerms = ['analyse', 'vurder', 'beregn', 'sammenlikn', 'konkluder'];
  
  const isComplex = complexContexts.includes(context) || 
                   longMessage || 
                   complexTerms.some(term => message.toLowerCase().includes(term));
  
  return isComplex ? 'gpt-4o' : 'gpt-4o-mini';
}

// Enhanced usage logging
async function logAIUsageEnhanced(params: {
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
    // Calculate cost using database function
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
      throw error;
    }
  } catch (error) {
    console.error('Failed to log AI usage:', error);
    throw error;
  }
}

// Intelligent fallback responses
function getIntelligentFallback(requestData: any): string {
  const context = requestData.context || 'general';
  const userRole = requestData.userRole || 'employee';
  
  const fallbacks = {
    'risk-assessment': 'Jeg har tekniske problemer, men her er noen generelle tips for risikovurdering: Start med å identifisere klientens bransje og nøkkelrisiki. Vurder materialitetsnivå basert på størrelse og kompleksitet.',
    'documentation': 'Tekniske problemer oppstått. For dokumentasjon, husk: ISA 230 krever at all dokumentasjon skal være tilstrekkelig og hensiktsmessig for å støtte revisjonskonklusjoner.',
    'client-detail': 'Midlertidig feil. For klientanalyse, se på nøkkeltall som omsetningsvekst, lønnsomhet og likviditet. Sammenlign med bransjegjennomsnitt.',
    'general': 'Jeg opplever tekniske problemer. Prøv igjen om litt, eller kontakt support hvis problemet vedvarer.'
  };
  
  const roleSpecific = userRole === 'partner' ? 
    ' Som partner bør du også vurdere klientporteføljens samlede risiko.' :
    userRole === 'manager' ? 
    ' Som manager, sørg for at teamet følger etablerte prosedyrer.' :
    ' Kontakt din manager hvis du trenger ytterligere veiledning.';
  
  return (fallbacks[context as keyof typeof fallbacks] || fallbacks.general) + roleSpecific;
}

// Intelligent system prompt building
function buildIntelligentSystemPrompt(
  context: string, 
  clientData: any, 
  userRole: string,
  enhancedContext: any,
  isGuestMode = false
): string {
  let basePrompt = `Du er Revy, en ekspert AI-revisjonsassistent for norske revisorer. Du har dyp kunnskap om:
- Norsk regnskapslovgivning og standarder (Regnskapsloven, NGRS, IFRS)
- ISA (International Standards on Auditing) - alle standarder
- Risikovurdering og revisjonsmetodikk
- Regnskapsanalyse og kontroller
- Norsk skatterett og MVA-regelverket
- Revisorlovgivning og etiske regler
- Praktisk revisjonsarbeid og dokumentasjon

Du kommuniserer alltid på norsk og er vennlig, profesjonell og præsis. Dine svar skal være konkrete og handlingsrettede.`;

  if (isGuestMode) {
    basePrompt += `\n\nVIKTIG: Brukeren er i gjestmodus og har begrenset tilgang. Gi generelle råd og veiledning, men nevn at full funksjonalitet krever innlogging. Hold svarene enkle og praktiske.`;
  }

  let contextPrompt = '';
  let knowledgePrompt = '';
  let clientPrompt = '';
  let proactivePrompt = '';

  // Add enhanced knowledge context
  if (enhancedContext.knowledge && enhancedContext.knowledge.length > 0) {
    knowledgePrompt = `\n\nHER ER RELEVANT FAGSTOFF FRA KUNNSKAPSBASEN. BRUK DETTE AKTIVT I SVARET DITT OG HENVIS TIL ARTIKLENE NÅR DET ER PASSENDE:\n\n`;
    enhancedContext.knowledge.forEach((article: any, index: number) => {
      knowledgePrompt += `ARTIKKEL ${index + 1}: "${article.title}"\n`;
      knowledgePrompt += `SAMMENDRAG: ${article.summary || (article.content || '').substring(0, 300) + '...'}\n`;
      knowledgePrompt += `SLUG (for linking): /fag/artikkel/${article.slug}\n\n`;
    });
    knowledgePrompt += `VIKTIG: Du MÅ basere svaret ditt på disse artiklene hvis de er relevante. Ikke si "Jeg har funnet noen artikler", men referer til dem direkte, f.eks. "I artikkelen 'Tittel på artikkel' står det at...".`;
  } else {
    knowledgePrompt = `\n\nINFO: Jeg fant ingen direkte relevante artikler i kunnskapsbasen for dette spørsmålet, men jeg kan fortsatt gi generell veiledning basert på min opplæring. Kunnskapsbasen eksisterer og kan søkes i.`;
  }

  // Enhanced client context with proactive insights
  if (enhancedContext.clientContext) {
    const client = enhancedContext.clientContext;
    clientPrompt = `\n\nUtvidet klient-informasjon:\n`;
    clientPrompt += `Klient: ${client.company_name} (${client.org_number})\n`;
    clientPrompt += `Bransje: ${client.industry}\n`;
    clientPrompt += `Fase: ${client.phase}\n`;
    clientPrompt += `Fremgang: ${client.progress}%\n`;
    
    if (client.risk_areas && client.risk_areas.length > 0) {
      clientPrompt += `Risikoområder: ${client.risk_areas.map((r: any) => `${r.name} (${r.risk})`).join(', ')}\n`;
    }

    // Add proactive insights based on data
    proactivePrompt = buildProactiveInsights(client);
  }

  // Enhanced context-specific prompts with workflow integration
  const contextPrompts = {
    'risk-assessment': `\nDu hjelper med risikovurdering. Fokuser på:
- Systematisk identifisering av risikoområder per ISA 315
- Vurdering av iboende risiko, kontrollrisiko og oppdagelsesrisiko
- Forslag til risikoreduserende tiltak og kontroller
- ISA 330 og utforming av risikoresponser
- Materialitetsvurderinger og terskelverdi-setting
- Proaktive anbefalinger basert på bransje og klientstørrelse`,

    'documentation': `\nDu hjelper med dokumentasjon. Fokuser på:
- Krav til revisjonsdokumentasjon per ISA 230
- Strukturering av arbeidspapirer og elektronisk arkivering
- Konklusjoner og faglige vurderinger
- Forberedelse til partner review og kvalitetskontroll
- Dokumentasjon av vesentlige forhold og unntak
- Automatisk kvalitetskontroll og missing elements`,

    'client-detail': `\nDu hjelper med klientanalyse. Fokuser på:
- Dypere risikovurderinger for denne spesifikke klienten
- Detaljerte forslag til revisjonshandlinger basert på bransje og størrelse
- Analyse av regnskapsdata og nøkkeltall
- Spesifikke dokumentasjonskrav og kontroller
- Planlegging av feltarbeid og tidsestimater
- Sammenligning med bransjegjennomsnitt og tidligere perioder`,

    'collaboration': `\nDu hjelper med samarbeid og teamarbeid. Fokuser på:
- Organisering av team og fordeling av arbeidsoppgaver
- Effektiv kommunikasjon og koordinering av revisjonsarbeid
- Kvalitetssikring og review-prosesser
- Tidsplanlegging, ressursfordeling og budsjettering
- Håndtering av teammøter og oppfølging
- Konfliktløsning og teamdynamikk`
  };

  contextPrompt = contextPrompts[context as keyof typeof contextPrompts] || `\nDu kan hjelpe med alle aspekter av revisjonsarbeid:
- Planlegging og gjennomføring av revisjoner per ISA-standarder
- Risikovurderinger og testing av kontroller
- Regnskapsanalyse og substansielle handlinger
- Dokumentasjon, rapportering og oppfølging
- Praktiske utfordringer i revisjonsarbeid`;

  const roleContext = isGuestMode
    ? '\nBrukeren er gjest og har begrenset tilgang. Gi generelle, praktiske råd om revisjonsarbeid uten tilgang til spesifikke klientdata.'
    : userRole === 'partner' 
    ? '\nBrukeren er partner og trenger høynivå strategisk veiledning om klientportefølje, risikostyring og forretningsutvikling. Fokuser på ledelsesperspektiv og beslutningsstøtte.'
    : userRole === 'manager'
    ? '\nBrukeren er manager og fokuserer på prosjektledelse, kvalitetssikring og teamkoordinering. Gi praktiske ledelses- og koordineringsråd.'
    : '\nBrukeren er revisor og trenger praktisk, detaljert veiledning i daglig revisjonsarbeid og tekniske spørsmål. Fokuser på håndverk og implementering.';

  return `${basePrompt}${knowledgePrompt}${clientPrompt}${proactivePrompt}${contextPrompt}${roleContext}

VIKTIG: Gi alltid konkrete, handlingsrettede råd. Referer til relevante ISA-standarder når det er aktuelt. Hold svarene fokuserte og praktiske. ${isGuestMode ? 'Nevn gjerne at innlogging gir tilgang til mer avanserte funksjoner.' : 'Vær proaktiv med forslag basert på klientdata og kontekst. Hvis du bruker kunnskap fra kunnskapsbasen, si ifra om det.'}`;
}

// Proactive insights based on client data
function buildProactiveInsights(client: any): string {
  let insights = '\n\nProaktive innsikter:\n';
  
  // Progress-based insights
  if (client.progress < 25) {
    insights += '- Klienten er i tidlig fase. Fokuser på planlegging og risikovurdering.\n';
  } else if (client.progress > 75) {
    insights += '- Klienten nærmer seg ferdigstillelse. Fokuser på avslutning og konklusjoner.\n';
  }
  
  // Risk-based insights
  const highRiskAreas = client.risk_areas?.filter((r: any) => r.risk === 'high') || [];
  if (highRiskAreas.length > 0) {
    insights += `- HØYRISIKO: ${highRiskAreas.map((r: any) => r.name).join(', ')} krever ekstra oppmerksomhet.\n`;
  }
  
  // Industry-specific insights
  if (client.industry) {
    const industryInsights = {
      'Bygg og anlegg': 'Vær oppmerksom på prosjektregnskapsføring og WIP-vurderinger.',
      'Handel': 'Fokuser på lagerverdsettelse og kundefordringer.',
      'Teknologi': 'Vurder immaterielle eiendeler og utviklingskostnader.',
      'Finans': 'Særlig oppmerksomhet på regulatoriske krav og risikostyring.'
    };
    
    const insight = industryInsights[client.industry as keyof typeof industryInsights];
    if (insight) {
      insights += `- Bransje-spesifikt: ${insight}\n`;
    }
  }
  
  // Overdue actions
  const overdueActions = client.client_audit_actions?.filter((action: any) => 
    action.due_date && new Date(action.due_date) < new Date() && action.status !== 'completed'
  ) || [];
  
  if (overdueActions.length > 0) {
    insights += `- FORSINKELSE: ${overdueActions.length} forfalt(e) oppgave(r) krever umiddelbar oppmerksomhet.\n`;
  }
  
  return insights;
}

async function buildEnhancedContext(message: string, context: string, clientData: any | null) {
  console.log('🏗️ Building enhanced context...');
  try {
    const knowledgePromise = searchRelevantKnowledge(message, context);
    
    const clientContextPromise = (clientData && clientData.id) 
      ? fetchEnhancedClientContext(clientData.id) 
      : Promise.resolve(null);
    
    const [knowledge, clientContext] = await Promise.all([
      knowledgePromise,
      clientContextPromise
    ]);
    
    console.log('✅ Enhanced context built.', { 
      hasKnowledge: !!knowledge && knowledge.length > 0,
      hasClientContext: !!clientContext 
    });

    return { knowledge, clientContext };
  } catch (err) {
    console.error("Error building enhanced context:", err);
    // Return a default object so the main flow doesn't crash
    return { knowledge: null, clientContext: null };
  }
}
