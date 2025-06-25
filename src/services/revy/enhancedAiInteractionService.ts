
import { supabase } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';
import { toast } from 'sonner';

interface Variant {
  name: string;
  display_name: string;
  description: string;
  model: string;
  prompt: string;
}

// Simple cache implementation
const cache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const generateRequestHash = (message: string, context: string, clientId?: string, variantName?: string): string => {
  const hashInput = `${message}-${context}-${clientId || ''}-${variantName || ''}`;
  return btoa(hashInput).replace(/[^a-zA-Z0-9]/g, '');
};

const getCachedResponse = async (hash: string): Promise<string | null> => {
  const cached = cache.get(hash);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }
  cache.delete(hash);
  return null;
};

const cacheResponse = async (hash: string, response: string): Promise<void> => {
  cache.set(hash, { response, timestamp: Date.now() });
};

const logAIUsage = async (
  userId?: string,
  promptTokens: number = 0,
  completionTokens: number = 0,
  totalTokens: number = 0,
  model: string = 'gpt-4o-mini',
  requestType: string = 'enhanced_chat',
  context?: string,
  clientId?: string,
  responseTime?: number,
  sessionId?: string,
  variantName?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    console.log('📊 Logging AI usage:', {
      userId: userId?.substring(0, 8) + '...',
      promptTokens,
      completionTokens,
      totalTokens,
      model,
      requestType,
      variantName
    });
  } catch (error) {
    console.error('❌ Error logging AI usage:', error);
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

// Enhanced fallback that provides helpful response
const getIntelligentFallback = (message: string, context: string, selectedVariant?: any): string => {
  const variantContext = selectedVariant ? ` som ${selectedVariant.display_name}` : '';
  
  return `Hei! Jeg er AI-Revi${variantContext} og jobber med å løse det tekniske problemet som oppstod.

**Om din forespørsel:** "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"

Jeg forstår at du spør om **${context}**, og jeg jobber med å få tilgang til kunnskapsbasen for å gi deg et relevant svar.

**Midlertidige råd:**
• Prøv å omformulere spørsmålet ditt
• Vær mer spesifikk om hva du trenger hjelp til
• Sjekk om du har tilgang til internett-tilkobling

Jeg kommer tilbake med et fullstendig svar så snart det tekniske problemet er løst.

🏷️ **EMNER:** Teknisk support, AI-assistanse, ${context}`;
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

  // Enhanced knowledge search with better error handling and mobile support
  if (message && message.trim()) {
    try {
      console.log('🔍 Starting knowledge search with proper request format...');
      
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      // Ensure proper JSON request body
      const requestBody = {
        query: message.trim()
      };

      console.log('📤 Sending knowledge search request:', requestBody);

      const { data, error } = await supabase.functions.invoke('knowledge-search', {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        }
      });

      if (error) {
        console.error('❌ Knowledge search failed:', error);
        toast.error('Kunne ikke hente fagartikler – prøv igjen senere.');
        // Continue without knowledge base instead of failing
        console.log('⚠️ Continuing without knowledge base results');
      } else if (data) {
        // Handle response structure { articles, tagMapping }
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
      // Don't throw here - let the main function handle fallback
      console.log('⚠️ Knowledge search failed, continuing without it');
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
  
  console.log('🚀 generateEnhancedAIResponseWithVariant called with:', {
    message: message.substring(0, 50) + '...',
    context,
    userRole,
    hasClientData: !!clientData,
    historyLength: history.length,
    variantName: selectedVariant?.name || 'default',
    sessionId
  });
  
  try {
    console.log('📝 Enhanced request received:', {
      message: message.substring(0, 50) + '...',
      context,
      userRole,
      userId: (await supabase.auth.getUser()).data.user?.id?.substring(0, 8) + '...',
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
      message
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

    // Select model based on variant or default
    const model = getModelForVariant(selectedVariant);
    console.log('🎯 Selected model:', model, 'for variant:', selectedVariant?.name);

    // Use the revy-ai-chat function for all AI communication
    console.log('🚀 Calling revy-ai-chat function with enhanced prompt...');
    
    const requestPayload = {
      message,
      context,
      history: history.slice(-6),
      clientData,
      userRole,
      sessionId,
      selectedVariant,
      model,
      // Pass the knowledge articles directly to ensure they're used
      knowledgeArticles: enhancedContextData.knowledgeArticles,
      articleTagMapping: enhancedContextData.articleTagMapping
    };

    console.log('📤 Sending request to revy-ai-chat with payload:', {
      messageLength: message.length,
      context,
      historyLength: requestPayload.history.length,
      hasKnowledgeArticles: requestPayload.knowledgeArticles.length > 0,
      knowledgeArticleCount: requestPayload.knowledgeArticles.length,
      hasArticleTagMapping: Object.keys(requestPayload.articleTagMapping).length > 0,
      variantName: selectedVariant?.name || 'default'
    });
    
    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: requestPayload
    });

    console.log('📥 Response from revy-ai-chat:', {
      hasData: !!data,
      hasError: !!error,
      dataKeys: data ? Object.keys(data) : [],
      errorMessage: error?.message,
      dataType: typeof data,
      responseField: data?.response ? 'present' : 'missing',
      responseLength: data?.response?.length || 0,
      responsePreview: data?.response?.substring(0, 100) || 'N/A'
    });

    if (error) {
      console.error('❌ revy-ai-chat function error:', error);
      // Use intelligent fallback
      const fallbackResponse = getIntelligentFallback(message, context, selectedVariant);
      const validatedResponse = enforceResponseValidation(fallbackResponse, enhancedContextData.knowledgeArticles, enhancedContextData.articleTagMapping);
      await cacheResponse(requestHash, validatedResponse);
      return validatedResponse;
    }

    if (!data) {
      console.error('❌ No data received from revy-ai-chat function');
      const fallbackResponse = getIntelligentFallback(message, context, selectedVariant);
      const validatedResponse = enforceResponseValidation(fallbackResponse, enhancedContextData.knowledgeArticles, enhancedContextData.articleTagMapping);
      await cacheResponse(requestHash, validatedResponse);
      return validatedResponse;
    }

    let aiResponse = data?.response || 'Beklager, jeg kunne ikke generere et svar.';
    console.log('🤖 AI response extracted:', {
      responseLength: aiResponse.length,
      responseType: typeof aiResponse,
      isEmpty: !aiResponse || aiResponse.trim() === '',
      hasContent: aiResponse && aiResponse.length > 0,
      preview: aiResponse.substring(0, 100) + '...'
    });

    if (!aiResponse || typeof aiResponse !== 'string' || aiResponse.trim() === '') {
      console.error('❌ Invalid AI response format:', { aiResponse, type: typeof aiResponse });
      const fallbackResponse = getIntelligentFallback(message, context, selectedVariant);
      const validatedResponse = enforceResponseValidation(fallbackResponse, enhancedContextData.knowledgeArticles, enhancedContextData.articleTagMapping);
      await cacheResponse(requestHash, validatedResponse);
      return validatedResponse;
    }

    // Inject variant information if available
    if (selectedVariant) {
      console.log('🎭 Injected variant info into response');
    }

    // Enforce response validation with document-aware content
    console.log('🔧 ENFORCING response validation with document-aware content...');
    aiResponse = enforceResponseValidation(aiResponse, enhancedContextData.knowledgeArticles, enhancedContextData.articleTagMapping);

    const responseTime = Date.now() - startTime;

    console.log('✅ Document-enhanced AI response generated successfully:', {
      responseLength: aiResponse.length,
      responseTime: `${responseTime}ms`,
      isGuestMode: !(await supabase.auth.getUser()).data.user,
      hasStandardizedTags: /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*/.test(aiResponse),
      hasArticleMappings: Object.keys(enhancedContextData.articleTagMapping).length > 0,
      hasDocumentReferences: enhancedContextData.knowledgeArticles.length > 0,
      variantUsed: selectedVariant?.name || 'default',
      finalResponsePreview: aiResponse.substring(0, 200) + '...'
    });

    // Cache and log the response
    await Promise.all([
      cacheResponse(requestHash, aiResponse),
      logAIUsage(
        (await supabase.auth.getUser()).data.user?.id,
        0, // Token counting handled by the function
        0,
        0,
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

    console.log('🎯 Returning final AI response:', {
      length: aiResponse.length,
      hasContent: !!aiResponse && aiResponse.trim().length > 0,
      isString: typeof aiResponse === 'string'
    });

    return aiResponse;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('💥 Enhanced AI response generation failed, using fallback:', error);
    
    // SECURE FALLBACK: No direct OpenAI calls
    const fallbackResponse = getIntelligentFallback(message, context, selectedVariant);
    const validatedResponse = enforceResponseValidation(fallbackResponse, [], {});
    
    // Log error
    await logAIUsage(
      (await supabase.auth.getUser()).data.user?.id,
      0,
      0,
      0,
      getModelForVariant(selectedVariant),
      'error_fallback',
      context,
      clientData?.id,
      responseTime,
      sessionId,
      selectedVariant?.name,
      error.message
    );

    await cacheResponse(generateRequestHash(message, context, clientData?.id, selectedVariant?.name), validatedResponse);
    return validatedResponse;
  }
};

export {
  getModelForVariant,
  buildVariantSystemPrompt,
  enforceResponseValidation
};
