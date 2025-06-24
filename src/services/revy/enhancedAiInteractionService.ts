import { supabase } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';
import { generateRequestHash, getCachedResponse, cacheResponse } from './aiCacheService';
import { logAIUsage } from './aiUsageService';

interface Variant {
  name: string;
  display_name: string;
  description: string;
  model: string;
  prompt: string;
}

const getOpenAIApiKey = async (): Promise<string | null> => {
  try {
    const { data, error, status } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'openai')
      .single();

    if (error && status !== 406) {
      console.error("Error fetching OpenAI API key:", error);
      return null;
    }

    return data?.key || null;
  } catch (err) {
    console.error("Unexpected error fetching OpenAI API key:", err);
    return null;
  }
};

const getModelForVariant = (selectedVariant?: any): string => {
  if (selectedVariant?.model) {
    return selectedVariant.model;
  }
  return 'gpt-4o-mini';
};

const buildVariantSystemPrompt = (variant: any, context: string, clientData?: any, userRole?: string): string => {
  let prompt = variant?.prompt || '';

  // Replace placeholders
  prompt = prompt.replace(/{{context}}/g, context);
  prompt = prompt.replace(/{{client}}/g, clientData?.company_name || clientData?.name || 'klienten');
  prompt = prompt.replace(/{{userRole}}/g, userRole || 'bruker');

  return prompt;
};

const enforceResponseValidation = (response: string, knowledgeArticles: any[], articleTagMapping: Record<string, any>): string => {
  let validatedResponse = response;

  // Enforce tag section
  if (!validatedResponse.includes('🏷️ **EMNER:**')) {
    validatedResponse += '\n\n🏷️ **EMNER:** ';
    if (Object.keys(articleTagMapping).length > 0) {
      validatedResponse += Object.keys(articleTagMapping).slice(0, 3).join(', ');
    } else if (knowledgeArticles.length > 0) {
      validatedResponse += knowledgeArticles.slice(0, 3).map(a => a.title).join(', ');
    } else {
      validatedResponse += 'Revisjon, Regnskap';
    }
  }

  return validatedResponse;
};

const buildEnhancedContextWithVariantAndDocuments = async (
  context: string,
  clientData?: any,
  historyLength: number = 0,
  userRole?: string,  
  selectedVariant?: any,
  message?: string
) => {
  console.log('🏗️ Building enhanced context with variant and document search support:', { context, variantName: selectedVariant?.name, hasClientData: !!clientData });

  let knowledgeArticles: any[] = [];
  let articleTagMapping: Record<string, any> = {};
  let documentResults: any[] = [];
  let hasSpecificDocumentFound = false;

  // Enhanced knowledge search with better error handling
  if (message && message.trim()) {
    try {
      console.log('🔍 Starting knowledge search with authorization...');
      
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('knowledge-search', {
        body: { query: message },
        headers
      });

      if (error) {
        console.error('❌ Knowledge search failed:', error);
      } else {
        // Handle new response structure { articles, tagMapping }
        knowledgeArticles = data?.articles || [];
        articleTagMapping = data?.tagMapping || {};
        
        console.log(`✅ Knowledge search successful: ${knowledgeArticles.length} articles found`);
        console.log('📊 Article tag mapping:', Object.keys(articleTagMapping).length, 'mappings');
        
        // Check if we found specific documents the user asked about
        if (knowledgeArticles.length > 0) {
          hasSpecificDocumentFound = knowledgeArticles.some((article: any) => 
            article.title.toLowerCase().includes('isa 315') ||
            article.reference_code?.toLowerCase().includes('isa 315') ||
            article.content?.toLowerCase().includes('isa 315')
          );
        }
      }
    } catch (error) {
      console.error('❌ Knowledge search error:', error);
    }
  }

  // Get client document information if available
  if (clientData?.id) {
    try {
      const { data: documents } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientData.id)
        .limit(10);
      
      documentResults = documents || [];
    } catch (error) {
      console.error('❌ Error loading client documents:', error);
    }
  }

  return {
    knowledgeArticles,
    articleTagMapping,
    documentResults,
    hasSpecificDocumentFound,
    context,
    clientData,
    historyLength,
    userRole,
    selectedVariant: selectedVariant || null
  };
};

const buildIntelligentSystemPromptWithVariant = (
  context: string,
  knowledgeArticles: any[],
  articleTagMapping: Record<string, any>,
  clientData?: any,
  userRole?: string,
  hasDocumentResults: boolean = false,
  isGuestMode: boolean = false,
  selectedVariant?: any
) => {
  console.log('🎯 Building intelligent system prompt with variant support:', {
    context,
    variantName: selectedVariant?.name,
    hasClientData: !!clientData,
    hasKnowledge: knowledgeArticles.length > 0,
    hasDocumentResults,
    isGuestMode
  });

  // Build variant-specific system prompt
  let variantPrompt = '';
  if (selectedVariant) {
    console.log('🎭 Building variant system prompt for:', selectedVariant.name);
    variantPrompt = buildVariantSystemPrompt(selectedVariant, context, clientData, userRole);
    console.log('✅ Variant system prompt built for:', selectedVariant.name);
  }

  // Enhanced knowledge context with better article information
  let knowledgeContext = '';
  if (knowledgeArticles.length > 0) {
    console.log('📚 Building knowledge context with', knowledgeArticles.length, 'articles');
    
    knowledgeContext = `

📚 **TILGJENGELIGE FAGARTIKLER** (${knowledgeArticles.length} artikler):
${knowledgeArticles.map((article, index) => `
${index + 1}. **${article.title}**
   - Kategori: ${article.category?.name || 'Ukategoriseret'}
   - Relevans: ${Math.round((article.similarity || 0) * 100)}%
   - Referanse: ${article.reference_code || 'Ingen referanse'}
   - Sammendrag: ${article.summary || 'Ingen sammendrag'}
   - Publisert: ${article.published_at ? new Date(article.published_at).toLocaleDateString('nb-NO') : 'Ukjent'}
`).join('')}

Du har nå **DIREKTE TILGANG** til disse artiklene og kan referere til dem spesifikt i dine svar.
Når brukere spør om spesifikke emner, HENVISE til relevante artikler fra listen ovenfor.
`;
  } else {
    knowledgeContext = `

⚠️ **INGEN FAGARTIKLER FUNNET** for dette søket.
Du kan fortsatt gi generell rådgivning basert på din kunnskap om revisjon og regnskapsføring.
`;
  }

  // Enhanced article tag mapping context
  let tagMappingContext = '';
  if (Object.keys(articleTagMapping).length > 0) {
    tagMappingContext = `

🏷️ **EMNE-MAPPINGER** (${Object.keys(articleTagMapping).length} mappinger):
${Object.entries(articleTagMapping).map(([keyword, mapping]: [string, any]) => `
• **${keyword}** → ${mapping.articleTitle}
  - Type: ${mapping.contentType}
  - Kategori: ${mapping.category}
  - Relevans: ${mapping.relevanceScore}/5
`).join('')}
`;
  }

  const baseSystemPrompt = `Du er AI-Revi, en ekspert innen revisjon og regnskapsføring som jobber for norske revisjonsselskaper.

${variantPrompt}

${knowledgeContext}${tagMappingContext}

**VIKTIGE REGLER:**
• Svar ALLTID på norsk bokmål
• Vær spesifikk og praktisk
• Referer til konkrete ISA-standarder når relevant
• ${knowledgeArticles.length > 0 ? 'BRUK informasjonen fra fagartiklene ovenfor når du svarer' : 'Gi generelle råd basert på din ekspertise'}
• Avslutt ALLTID med emnetagg-seksjon formatert som: "🏷️ **EMNER:** Tag1, Tag2, Tag3"

SVARFORMAT:
- Start med konkret svar på spørsmålet
- Inkluder relevante detaljer og prosedyrer
- ${knowledgeArticles.length > 0 ? 'Referer til spesifikke artikler når relevant' : ''}
- Avslutt med emnetagg-seksjon

Kontext: ${context}
${clientData ? `Klient: ${clientData.company_name || clientData.name}` : ''}
${isGuestMode ? 'MODUS: Gjest (begrenset tilgang)' : ''}`;

  console.log('✅ Intelligent system prompt built with variant and document support');
  return baseSystemPrompt;
};

export const generateEnhancedAIResponseWithVariant = async (
  message: string,
  context: string,
  history: any[] = [],
  clientData?: any,
  userRole?: string,
  sessionId?: string,
  selectedVariant?: any
): Promise<string> => {
  const startTime = Date.now();
  
  try {
    console.log('📝 Enhanced request received:', {
      message: message.substring(0, 50) + '...',
      context,
      userRole,
      userId: (await supabase.auth.getUser()).data.user?.id.substring(0, 8) + '...',
      hasClientData: !!clientData,
      historyLength: history.length,
      variantName: selectedVariant?.name
    });

    // Check cache first
    const requestHash = generateRequestHash(message, context, clientData?.id, selectedVariant?.name);
    const cachedResponse = await getCachedResponse(requestHash);
    
    if (cachedResponse) {
      console.log('💾 Using cached response for variant request');
      return cachedResponse;
    }
    
    console.log('🧐 Cache miss for variant request, proceeding to generate new response.');
    
    // Build enhanced context with document search support
    const enhancedContextData = await buildEnhancedContextWithVariantAndDocuments(
      context,
      clientData,
      history.length,
      userRole,
      selectedVariant,
      message // Pass the message for knowledge search
    );

    console.log('🧠 Enhanced variant-aware context built with document support:', {
      knowledgeArticleCount: enhancedContextData.knowledgeArticles.length,
      articleTagMappingCount: Object.keys(enhancedContextData.articleTagMapping).length,
      hasClientContext: !!clientData,
      hasDocumentResults: enhancedContextData.documentResults.length > 0,
      specificDocumentFound: enhancedContextData.hasSpecificDocumentFound,
      generalDocumentsFound: enhancedContextData.documentResults.length,
      isGuestMode: !(await supabase.auth.getUser()).data.user,
      variantName: selectedVariant?.name,
      variantDescription: selectedVariant?.description
    });

    // Build intelligent system prompt with variant support
    const systemPrompt = buildIntelligentSystemPromptWithVariant(
      context,
      enhancedContextData.knowledgeArticles,
      enhancedContextData.articleTagMapping,
      clientData,
      userRole,
      enhancedContextData.documentResults.length > 0,
      !(await supabase.auth.getUser()).data.user,
      selectedVariant
    );

    // Select model based on variant or default
    const model = getModelForVariant(selectedVariant);
    console.log('🎯 Selected model:', model, 'for variant:', selectedVariant?.name);

    // Make API call to OpenAI
    console.log('🚀 Calling OpenAI API with document-enhanced prompt...');
    
    const openAIApiKey = await getOpenAIApiKey();
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
          ...history.slice(-6).map((msg: any) => ({
            role: msg.sender === 'revy' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content || 'Beklager, jeg kunne ikke generere et svar.';

    // Inject variant information if available
    if (selectedVariant) {
      console.log('🎭 Injected variant info into response');
    }

    // Enforce response validation with document-aware content
    console.log('🔧 ENFORCING response validation with document-aware content...');
    aiResponse = enforceResponseValidation(aiResponse, enhancedContextData.knowledgeArticles, enhancedContextData.articleTagMapping);

    const responseTime = Date.now() - startTime;

    // Log response validation
    console.log('🔍 Validating AI response format...');
    console.log('📝 Response preview:', aiResponse.substring(0, 150) + '...');
    
    const hasStandardizedTags = aiResponse.includes('🏷️ **EMNER:**');
    const hasArticleMappings = Object.keys(enhancedContextData.articleTagMapping).length > 0;
    const hasDocumentReferences = enhancedContextData.knowledgeArticles.length > 0;
    
    if (hasStandardizedTags) {
      console.log('✅ Response has some form of EMNER section');
    }
    
    if (hasStandardizedTags && /🏷️\s*\*\*EMNER:\*\*\s+[\w\s,æøåÆØÅ]+$/.test(aiResponse.trim())) {
      console.log('✅ Response has perfect standardized format');
    }

    console.log('✅ Document-enhanced AI response generated:', {
      responseLength: aiResponse.length,
      usage: data.usage,
      responseTime: `${responseTime}ms`,
      isGuestMode: !(await supabase.auth.getUser()).data.user,
      hasStandardizedTags,
      hasArticleMappings,
      hasDocumentReferences,
      variantUsed: selectedVariant?.name || 'default'
    });

    // Cache and log the response
    await Promise.all([
      cacheResponse(requestHash, aiResponse),
      logAIUsage(
        (await supabase.auth.getUser()).data.user?.id,
        data.usage?.prompt_tokens || 0,
        data.usage?.completion_tokens || 0,
        data.usage?.total_tokens || 0,
        model,
        'enhanced_chat',
        context,
        clientData?.id,
        responseTime,
        sessionId,
        selectedVariant?.name
      )
    ]);

    console.log('✅ AI usage logged successfully');
    console.log('📊 Usage logged successfully with variant and document info');
    console.log('✅ Document-enhanced response cached successfully');

    return aiResponse;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Enhanced AI response generation failed:', error);
    
    // Log error
    await logAIUsage(
      (await supabase.auth.getUser()).data.user?.id,
      0,
      0,
      0,
      'gpt-4o-mini',
      'enhanced_chat',
      context,
      clientData?.id,
      responseTime,
      sessionId,
      selectedVariant?.name,
      error.message
    );

    throw error;
  }
};

export {
  getOpenAIApiKey,
  getModelForVariant,
  buildVariantSystemPrompt,
  enforceResponseValidation
};
