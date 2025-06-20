
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
  console.log('🤖 AI-Revi Chat function started with enhanced document reading support');
  
  if (isOptions(req)) {
    return handleCors();
  }

  try {
    const requestBody = await req.json();
    const { 
      message, 
      context = 'general', 
      history = [], 
      clientData, 
      userRole, 
      sessionId, 
      userId,
      variant: selectedVariant
    } = requestBody;
    
    console.log('📝 Enhanced request received:', {
      message: `${message.substring(0, 50)}...`,
      context,
      userRole,
      userId: `${userId?.substring(0, 8)}...`,
      hasClientData: !!clientData,
      historyLength: history.length,
      variantName: selectedVariant?.name || 'default'
    });

    // Check if this is a knowledge-related query and if we should seed tags
    const isKnowledgeQuery = /\b(inntekter?|revisjon|isa|fagstoff|artikkel|retningslinje|tags?|emner)\b/i.test(message);
    
    if (isKnowledgeQuery) {
      console.log('🏷️ Knowledge query detected, ensuring article tags are seeded...');
      try {
        await seedArticleTags();
      } catch (error) {
        console.log('⚠️ Tag seeding failed, continuing with query:', error.message);
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
      console.log('✅ Cache hit for variant-aware request!', { 
        requestHash: cachedResponse.requestHash?.substring(0, 16) + '...',
        variantName: selectedVariant?.name
      });
      
      const validation = validateAIResponse(cachedResponse.response);
      const finalResponse = validation.fixedResponse || cachedResponse.response;
      
      console.log('✅ Cached response validated and ready with guaranteed tags');
      
      return new Response(JSON.stringify({ response: finalResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('🧐 Cache miss for variant request, proceeding to generate new response.');

    // Build enhanced context with variant and document support
    const enhancedContext = await buildEnhancedContextWithVariant(
      message, 
      context, 
      clientData,
      selectedVariant
    );
    
    console.log('🧠 Enhanced variant-aware context built with document support:', {
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

    // Select optimal model
    const selectedModel = selectOptimalModel(message, context, !userId);
    console.log('🎯 Selected model:', selectedModel, 'for variant:', selectedVariant?.name);

    // Build system prompt with variant-specific enhancements and document context
    const systemPrompt = await buildIntelligentSystemPromptWithVariant(
      context,
      clientData,
      userRole,
      enhancedContext,
      !userId,
      selectedVariant
    );

    // Add explicit tag instruction
    const enhancedSystemPrompt = systemPrompt + '\n\nIMPORTANT: ALWAYS end your response with a line: "🏷️ **EMNER:** [list relevant Norwegian tags separated by commas]". This is required for proper UI functionality.';

    const startTime = Date.now();
    console.log('🚀 Calling OpenAI API with document-enhanced prompt...');

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const data = await openaiResponse.json();
    const responseTime = Date.now() - startTime;
    let aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('❌ No content in OpenAI response:', data);
      throw new Error('No response content from OpenAI');
    }

    // Inject article mappings and variant info into response metadata
    if (enhancedContext.articleTagMapping && Object.keys(enhancedContext.articleTagMapping).length > 0) {
      aiResponse += `\n\n<!-- ARTICLE_MAPPINGS: ${JSON.stringify(enhancedContext.articleTagMapping)} -->`;
      console.log('📎 Injected article mappings into response');
    }

    if (selectedVariant) {
      aiResponse += `\n\n<!-- VARIANT_INFO: ${JSON.stringify({
        name: selectedVariant.name,
        display_name: selectedVariant.display_name,
        specialization: selectedVariant.description
      })} -->`;
      console.log('🎭 Injected variant info into response');
    }

    // Add document reference metadata if documents were used
    if (enhancedContext.documentSearchResults) {
      const documentRefs = [];
      
      if (enhancedContext.documentSearchResults.specificDocument) {
        documentRefs.push({
          id: enhancedContext.documentSearchResults.specificDocument.id,
          fileName: enhancedContext.documentSearchResults.specificDocument.fileName,
          category: enhancedContext.documentSearchResults.specificDocument.category,
          summary: enhancedContext.documentSearchResults.specificDocument.summary,
          confidence: enhancedContext.documentSearchResults.specificDocument.confidence,
          uploadDate: enhancedContext.documentSearchResults.specificDocument.uploadDate
        });
      }
      
      if (enhancedContext.documentSearchResults.generalDocuments) {
        for (const doc of enhancedContext.documentSearchResults.generalDocuments.slice(0, 3)) {
          documentRefs.push({
            id: doc.id,
            fileName: doc.fileName,
            category: doc.category,
            summary: doc.summary,
            confidence: doc.confidence,
            relevantText: doc.relevantText,
            uploadDate: doc.uploadDate
          });
        }
      }
      
      if (documentRefs.length > 0) {
        aiResponse += `\n\n<!-- DOCUMENT_REFERENCES: ${JSON.stringify(documentRefs)} -->`;
        console.log('📄 Injected document references into response');
      }
    }

    // Validate and fix the AI response
    console.log('🔧 ENFORCING response validation with document-aware content...');
    const validation = validateAIResponse(aiResponse);
    
    if (validation.fixedResponse) {
      aiResponse = validation.fixedResponse;
      console.log('✅ Response was standardized with guaranteed tag format and document context');
    }

    console.log('✅ Document-enhanced AI response generated:', {
      responseLength: aiResponse.length,
      usage: data.usage,
      responseTime: `${responseTime}ms`,
      isGuestMode: !userId,
      hasStandardizedTags: /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*/.test(aiResponse),
      hasArticleMappings: aiResponse.includes('ARTICLE_MAPPINGS'),
      hasDocumentReferences: aiResponse.includes('DOCUMENT_REFERENCES'),
      variantUsed: selectedVariant?.name || 'default'
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
        console.log('📊 Usage logged successfully with variant and document info');
      } catch (error) {
        console.error('❌ Failed to log usage:', error);
      }
    }

    // Cache the response with variant awareness
    if (userId) {
      try {
        await cacheResponse(cacheKey, aiResponse, userId, clientData?.id, selectedModel);
        console.log('✅ Document-enhanced response cached successfully');
      } catch (error) {
        console.error('❌ Failed to cache response:', error);
      }
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Function error with document support:', error);
    
    // Enhanced fallback response with variant awareness
    const requestData = await req.json().catch(() => ({}));
    let fallbackResponse = getIntelligentFallback(requestData);
    
    // Add variant-specific fallback context
    if (requestData.variant) {
      const variantTip = getVariantContextualTips(requestData.variant, requestData.context, requestData.clientData);
      if (variantTip) {
        fallbackResponse += `\n\n💡 **${requestData.variant.display_name} Tips:** ${variantTip}`;
      }
    }
    
    console.log('🔧 Validating fallback response for proper tag format...');
    const validation = validateAIResponse(fallbackResponse);
    if (validation.fixedResponse) {
      fallbackResponse = validation.fixedResponse;
      console.log('✅ Fallback response fixed with guaranteed tags');
    }
    
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
