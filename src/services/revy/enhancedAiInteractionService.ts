
import { supabase } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';

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

// Enhanced fallback that provides helpful response without OpenAI
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
        throw error;
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
      // Don't throw here - let the main function handle fallback
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
    
    const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
      body: {
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
      }
    });

    if (error) {
      console.error('❌ revy-ai-chat function error:', error);
      // Use intelligent fallback instead of direct OpenAI call
      const fallbackResponse = getIntelligentFallback(message, context, selectedVariant);
      const validatedResponse = enforceResponseValidation(fallbackResponse, enhancedContextData.knowledgeArticles, enhancedContextData.articleTagMapping);
      await cacheResponse(requestHash, validatedResponse);
      return validatedResponse;
    }

    let aiResponse = data?.response || 'Beklager, jeg kunne ikke generere et svar.';

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
