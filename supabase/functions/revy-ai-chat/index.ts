
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { log } from "../_shared/log.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function isOptions(req: Request): boolean {
  return req.method === 'OPTIONS'
}

function handleCors(): Response {
  return new Response(null, { headers: corsHeaders })
}

// Import local modules
import { buildIntelligentSystemPromptWithVariant } from './lib/improved-prompt.ts'
import { buildEnhancedContextWithVariant } from './lib/enhanced-context.ts'
import { selectOptimalModel, getIntelligentFallback } from './lib/utils.ts'
import { logUsage } from './lib/logging.ts'
import { getCachedResponse, cacheResponse } from './lib/cache.ts'
import { seedArticleTags } from './lib/seed-article-tags.ts'
import { validateAIResponse } from './lib/response-validator.ts'
import { getVariantContextualTips } from './lib/variant-handler.ts'

serve(async (req) => {
  log('🤖 AI-Revi Chat function started with enhanced document reading support');
  
  if (isOptions(req)) {
    return handleCors();
  }

  try {
    let requestBody;
    try {
      const bodyText = await req.text();
      log('📝 Raw request body length:', bodyText?.length || 0);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('❌ Empty request body received');
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(bodyText);
      log('✅ Request body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON format in request body',
        isError: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { 
      message, 
      context = 'general', 
      history = [], 
      clientData, 
      userRole, 
      sessionId, 
      userId,
      selectedVariant,
      systemPrompt,
      model,
      knowledgeArticles = [],
      articleTagMapping = {}
    } = requestBody;
    
    log('📝 Enhanced request received:', {
      message: `${message?.substring(0, 50) || 'No message'}...`,
      context,
      userRole,
      userId: userId ? `${userId.substring(0, 8)}...` : 'guest',
      hasClientData: !!clientData,
      historyLength: history.length,
      variantName: selectedVariant?.name || 'default',
      hasSystemPrompt: !!systemPrompt,
      hasKnowledgeArticles: knowledgeArticles.length > 0,
      knowledgeArticleCount: knowledgeArticles.length,
      hasMessage: !!message,
      messageLength: message?.length || 0,
      sessionId
    });

    if (!message || message.trim() === '') {
      console.error('❌ No message provided in request');
      return new Response(JSON.stringify({ 
        error: 'Message is required',
        isError: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment');
      throw new Error('OpenAI API key is not configured');
    }

    // Check if this is a knowledge-related query and if we should seed tags
    const isKnowledgeQuery = /\b(inntekter?|revisjon|isa|fagstoff|artikkel|retningslinje|tags?|emner)\b/i.test(message);
    
    if (isKnowledgeQuery) {
      log('🏷️ Knowledge query detected, ensuring article tags are seeded...');
      try {
        await seedArticleTags();
      } catch (error) {
        log('⚠️ Tag seeding failed, continuing with query:', error.message);
      }
    }

    // Check cache first (include variant in cache key)
    const cacheKey = JSON.stringify({ 
      message, 
      context, 
      clientData, 
      userRole, 
      variantName: selectedVariant?.name 
    });
    const cachedResponse = await getCachedResponse(cacheKey, userId);
    
    if (cachedResponse) {
      log('✅ Cache hit for variant-aware request!', { 
        requestHash: cachedResponse.requestHash?.substring(0, 16) + '...',
        variantName: selectedVariant?.name
      });
      
      const validation = validateAIResponse(cachedResponse.response);
      const finalResponse = validation.fixedResponse || cachedResponse.response;
      
      log('✅ Cached response validated and ready with guaranteed tags');
      
      return new Response(JSON.stringify({ response: finalResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    log('🧐 Cache miss for variant request, proceeding to generate new response.');

    // Use the enhanced system prompt if provided, otherwise build context
    let enhancedSystemPrompt = systemPrompt;
    
    if (!enhancedSystemPrompt) {
      // Build enhanced context with variant and document support
      const enhancedContext = await buildEnhancedContextWithVariant(
        message, 
        context, 
        clientData,
        selectedVariant
      );
      
      log('🧠 Enhanced variant-aware context built with document support:', {
        knowledgeArticleCount: enhancedContext.knowledge?.length || 0,
        articleTagMappingCount: Object.keys(enhancedContext.articleTagMapping || {}).length,
        hasClientContext: !!enhancedContext.clientContext,
        hasDocumentResults: !!enhancedContext.documentSearchResults,
        specificDocumentFound: !!enhancedContext.documentSearchResults?.specificDocument,
        generalDocumentsFound: enhancedContext.documentSearchResults?.generalDocuments?.length || 0,
        isGuestMode: !userId,
        variantName: selectedVariant?.name,
        variantDescription: selectedVariant?.description
      });

      // Build system prompt with variant-specific enhancements and document context
      enhancedSystemPrompt = await buildIntelligentSystemPromptWithVariant(
        context,
        clientData,
        userRole,
        enhancedContext,
        !userId,
        selectedVariant
      );
    } else {
      log('📝 Using provided enhanced system prompt with knowledge articles');
    }

    // Select optimal model
    const selectedModel = model || selectOptimalModel(message, context, !userId);
    log('🎯 Selected model:', selectedModel, 'for variant:', selectedVariant?.name);

    // Add explicit tag instruction
    enhancedSystemPrompt += '\n\nIMPORTANT: ALWAYS end your response with a line: "🏷️ **EMNER:** [list relevant Norwegian tags separated by commas]". This is required for proper UI functionality.';

    const startTime = Date.now();
    log('🚀 Calling OpenAI API with document-enhanced prompt...');
    log('📊 OpenAI request details:', {
      model: selectedModel,
      messagesCount: history.length + 2, // system + history + user message
      temperature: selectedVariant?.name === 'methodology-expert' ? 0.1 : 0.3,
      maxTokens: 1500
    });

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          ...history.map((msg: any) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
        temperature: selectedVariant?.name === 'methodology-expert' ? 0.1 : 0.3,
        stream: false,
      }),
    });

    log('📥 OpenAI response status:', openaiResponse.status, openaiResponse.statusText);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const data = await openaiResponse.json();
    const responseTime = Date.now() - startTime;
    
    log('📊 OpenAI response data:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      hasUsage: !!data.usage,
      usage: data.usage,
      responseTime: `${responseTime}ms`
    });

    let aiResponse = data.choices?.[0]?.message?.content;

    log('🔍 AI response extraction:', {
      hasAiResponse: !!aiResponse,
      aiResponseType: typeof aiResponse,
      aiResponseLength: aiResponse?.length || 0,
      isEmpty: !aiResponse || aiResponse.trim() === '',
      preview: aiResponse?.substring(0, 100) || 'N/A'
    });

    if (!aiResponse) {
      console.error('❌ No content in OpenAI response:', data);
      throw new Error('No response content from OpenAI');
    }

    log('📄 Raw AI response received:', {
      responseLength: aiResponse.length,
      hasValidContent: aiResponse.trim().length > 0,
      startsWithGreeting: /^(hei|hallo|god)/i.test(aiResponse.trim())
    });

    // Inject article mappings and variant info into response metadata
    if (articleTagMapping && Object.keys(articleTagMapping).length > 0) {
      aiResponse += `\n\n<!-- ARTICLE_MAPPINGS: ${JSON.stringify(articleTagMapping)} -->`;
      log('📎 Injected article mappings into response');
    }

    if (selectedVariant) {
      aiResponse += `\n\n<!-- VARIANT_INFO: ${JSON.stringify({
        name: selectedVariant.name,
        display_name: selectedVariant.display_name,
        specialization: selectedVariant.description
      })} -->`;
      log('🎭 Injected variant info into response');
    }

    // Add knowledge article reference metadata if articles were provided
    if (knowledgeArticles && knowledgeArticles.length > 0) {
      const articleRefs = knowledgeArticles.slice(0, 5).map((article: any) => ({
        id: article.id,
        title: article.title,
        category: article.category?.name,
        similarity: article.similarity,
        reference_code: article.reference_code
      }));

      aiResponse += `\n\n<!-- KNOWLEDGE_ARTICLES: ${JSON.stringify(articleRefs)} -->`;
      log('📚 Injected knowledge article references into response');
    }

    // Add document reference metadata if search results are available
    if (enhancedContext.documentSearchResults) {
      const docRefs: Array<{ id: string; fileName: string; snippet?: string }> = [];

      if (enhancedContext.documentSearchResults.specificDocument) {
        const doc = enhancedContext.documentSearchResults.specificDocument;
        docRefs.push({
          id: doc.id,
          fileName: doc.fileName,
          snippet: doc.extractedText?.substring(0, 200)
        });
      }

      if (enhancedContext.documentSearchResults.generalDocuments?.length) {
        for (const doc of enhancedContext.documentSearchResults.generalDocuments) {
          docRefs.push({
            id: doc.id,
            fileName: doc.fileName,
            snippet: doc.relevantText?.substring(0, 200)
          });
        }
      }

      if (docRefs.length > 0) {
        aiResponse += `\n\n<!-- DOCUMENT_REFERENCES: ${JSON.stringify(docRefs)} -->`;
        console.log('📂 Injected document references into response');
      }
    }

    // Validate and fix the AI response
    log('🔧 ENFORCING response validation with document-aware content...');
    const validation = validateAIResponse(aiResponse);
    
    if (validation.fixedResponse) {
      aiResponse = validation.fixedResponse;
      log('✅ Response was standardized with guaranteed tag format and document context');
    }

    log('✅ Document-enhanced AI response generated successfully:', {
      responseLength: aiResponse.length,
      usage: data.usage,
      responseTime: `${responseTime}ms`,
      isGuestMode: !userId,
      hasStandardizedTags: /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*/.test(aiResponse),
      hasArticleMappings: aiResponse.includes('ARTICLE_MAPPINGS'),
      hasKnowledgeReferences: aiResponse.includes('KNOWLEDGE_ARTICLES'),
      variantUsed: selectedVariant?.name || 'default',
      finalPreview: aiResponse.substring(0, 200) + '...',
      sessionId
    });

    // Log usage if user is authenticated
    if (userId && data.usage) {
      try {
        await logUsage({
          userId,
          model: selectedModel,
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
          estimatedCostUsd: calculateCost(selectedModel, data.usage.prompt_tokens, data.usage.completion_tokens),
          clientId: clientData?.id,
          responseTimeMs: responseTime,
          sessionId,
          contextType: context + (selectedVariant ? `_${selectedVariant.name}` : '')
        });
        log('📊 Usage logged successfully with variant and document info');
      } catch (error) {
        console.error('❌ Failed to log usage:', error);
      }
    }

    // Cache the response with variant awareness
    if (userId) {
      try {
        await cacheResponse(cacheKey, aiResponse, userId, clientData?.id, selectedModel);
        log('✅ Document-enhanced response cached successfully');
      } catch (error) {
        console.error('❌ Failed to cache response:', error);
      }
    }

    log('🎯 Returning response to client:', {
      hasResponse: !!aiResponse,
      responseLength: aiResponse.length,
      responseType: typeof aiResponse,
      isValidString: typeof aiResponse === 'string' && aiResponse.trim().length > 0,
      sessionId
    });

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Function error with document support:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Enhanced fallback response with variant awareness
    let requestData = {};
    try {
      const bodyText = await req.text();
      if (bodyText && bodyText.trim()) {
        requestData = JSON.parse(bodyText);
      }
    } catch (e) {
      console.error('❌ Failed to parse request data for fallback:', e.message);
    }
    
    let fallbackResponse = getIntelligentFallback(requestData);
    
    // Add variant-specific fallback context
    if (requestData.selectedVariant) {
      const variantTip = getVariantContextualTips(requestData.selectedVariant, requestData.context, requestData.clientData);
      if (variantTip) {
        fallbackResponse += `\n\n💡 **${requestData.selectedVariant.display_name} Tips:** ${variantTip}`;
      }
    }
    
    log('🔧 Validating fallback response for proper tag format...');
    const validation = validateAIResponse(fallbackResponse);
    if (validation.fixedResponse) {
      fallbackResponse = validation.fixedResponse;
      log('✅ Fallback response fixed with guaranteed tags');
    }
    
    log('🚨 Returning error response:', {
      hasFallbackResponse: !!fallbackResponse,
      fallbackLength: fallbackResponse?.length || 0,
      errorMessage: error.message,
      sessionId
    });
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      isError: true,
      error: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs = {
    'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
    'gpt-4o': { prompt: 0.005, completion: 0.015 },
    'gpt-4': { prompt: 0.03, completion: 0.06 }
  };
  
  const modelCosts = costs[model as keyof typeof costs] || costs['gpt-4o-mini'];
  return (promptTokens * modelCosts.prompt / 1000) + (completionTokens * modelCosts.completion / 1000);
}
