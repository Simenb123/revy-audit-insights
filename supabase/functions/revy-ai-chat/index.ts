import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, isOptions, handleCors } from './lib/cors.ts'
import { buildIntelligentSystemPrompt } from './lib/prompt.ts'
import { buildEnhancedContext } from './lib/context.ts'
import { selectOptimalModel, getIntelligentFallback } from './lib/utils.ts'
import { logUsage } from './lib/logging.ts'
import { getCachedResponse, cacheResponse } from './lib/cache.ts'
import { seedArticleTags } from './lib/seed-article-tags.ts'
import { validateAIResponse } from './lib/response-validator.ts'

serve(async (req) => {
  console.log('🤖 AI-Revy Chat function started');
  
  if (isOptions(req)) {
    return handleCors();
  }

  try {
    const requestBody = await req.json();
    const { message, context = 'general', history = [], clientData, userRole, sessionId, userId } = requestBody;
    
    console.log('📝 Request received:', {
      message: `${message.substring(0, 50)}...`,
      context,
      userRole,
      userId: `${userId?.substring(0, 8)}...`,
      hasClientData: !!clientData,
      historyLength: history.length
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

    // Check cache first
    const cacheKey = JSON.stringify({ message, context, clientData, userRole });
    const cachedResponse = await getCachedResponse(cacheKey, userId);
    
    if (cachedResponse) {
      console.log('✅ Cache hit!', { requestHash: cachedResponse.requestHash?.substring(0, 16) + '...' });
      
      // VALIDATE CACHED RESPONSE TOO - this is important!
      const validation = validateAIResponse(cachedResponse.response);
      const finalResponse = validation.fixedResponse || cachedResponse.response;
      
      return new Response(JSON.stringify({ response: finalResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('🧐 Cache miss, proceeding to generate new response.');

    // Build enhanced context with improved search and article mappings
    const enhancedContext = await buildEnhancedContext(message, context, clientData);
    
    console.log('🧠 Enhanced context built:', {
      knowledgeArticleCount: enhancedContext.knowledge?.length || 0,
      articleTagMappingCount: Object.keys(enhancedContext.articleTagMapping || {}).length,
      hasClientContext: !!enhancedContext.clientContext,
      isGuestMode: !userId
    });

    // Select optimal model
    const selectedModel = selectOptimalModel(message, context, !userId);
    console.log('🎯 Selected model:', selectedModel);

    // Build system prompt with article mappings
    const systemPrompt = await buildIntelligentSystemPrompt(
      context,
      clientData,
      userRole,
      enhancedContext,
      !userId
    );

    const startTime = Date.now();
    console.log('🚀 Calling OpenAI API...');

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
          { role: 'system', content: systemPrompt },
          ...history.map((msg: any) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.3,
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

    // Inject article mappings into response metadata for frontend parsing
    if (enhancedContext.articleTagMapping && Object.keys(enhancedContext.articleTagMapping).length > 0) {
      aiResponse += `\n\n<!-- ARTICLE_MAPPINGS: ${JSON.stringify(enhancedContext.articleTagMapping)} -->`;
      console.log('📎 Injected article mappings into response');
    }

    // 🚨 CRITICAL FIX: ALWAYS validate and fix the AI response
    console.log('🔧 Forcing response validation and tag injection...');
    const validation = validateAIResponse(aiResponse);
    
    // ALWAYS use the fixed response if available, otherwise force fix it
    if (validation.fixedResponse) {
      aiResponse = validation.fixedResponse;
      console.log('✅ Response was fixed with forced tag injection');
    } else if (!validation.isValid) {
      // This should never happen with our new validator, but just in case
      aiResponse += '\n\n🏷️ **EMNER:** Revisjon, Fagstoff, Regnskap';
      console.log('🔧 Emergency tag injection applied');
    }

    console.log('✅ AI response generated with guaranteed tags and article mappings:', {
      responseLength: aiResponse.length,
      usage: data.usage,
      responseTime: `${responseTime}ms`,
      isGuestMode: !userId,
      hasTags: /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*/.test(aiResponse),
      hasArticleMappings: aiResponse.includes('ARTICLE_MAPPINGS')
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
          contextType: context
        });
        console.log('📊 Usage logged successfully');
      } catch (error) {
        console.error('❌ Failed to log usage:', error);
      }
    }

    // Cache the response (with tags and article mappings)
    if (userId) {
      try {
        await cacheResponse(cacheKey, aiResponse, userId, clientData?.id, selectedModel);
        console.log('✅ Response cached successfully with tags and article mappings');
      } catch (error) {
        console.error('❌ Failed to cache response:', error);
      }
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Function error:', error);
    
    // Even fallback responses should have tags!
    let fallbackResponse = getIntelligentFallback(await req.json().catch(() => ({})));
    const validation = validateAIResponse(fallbackResponse);
    if (validation.fixedResponse) {
      fallbackResponse = validation.fixedResponse;
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
