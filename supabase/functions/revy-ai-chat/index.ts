
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from './lib/supabase.ts';
import { getRequestHash } from './lib/cache.ts';
import { logAIUsageEnhanced } from './lib/logging.ts';
import { buildEnhancedContext } from './lib/context.ts';
import { selectOptimalModel, getIntelligentFallback } from './lib/utils.ts';
import { buildIntelligentSystemPrompt } from './lib/prompt.ts';

/*
  IMPORTANT: This function uses a cache table named `ai_cache`.
  Please run the following SQL in your Supabase SQL Editor to enable caching.
  The app will work without it, but caching provides significant cost and performance benefits.

  -- SQL to create cache table and helper function
  CREATE TABLE public.ai_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    request_hash text NOT NULL UNIQUE,
    response jsonb NOT NULL,
    model text NOT NULL,
    hits integer DEFAULT 1 NOT NULL,
    last_hit_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    client_id uuid REFERENCES clients(id)
  );

  COMMENT ON TABLE public.ai_cache IS 'Stores cached responses from AI interactions to reduce costs and latency.';
  COMMENT ON COLUMN public.ai_cache.request_hash IS 'SHA-256 hash of the normalized request payload (message, context, client_id, userRole).';
  COMMENT ON COLUMN public.ai_cache.hits IS 'Number of times the cached response has been served.';

  CREATE INDEX idx_ai_cache_request_hash ON public.ai_cache(request_hash);
  CREATE INDEX idx_ai_cache_user_client ON public.ai_cache(user_id, client_id);

  CREATE OR REPLACE FUNCTION public.increment_cache_hit(hash_to_update text)
  RETURNS void
  LANGUAGE plpgsql
  AS $$
  BEGIN
    UPDATE public.ai_cache
    SET
      hits = hits + 1,
      last_hit_at = now()
    WHERE request_hash = hash_to_update;
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.increment_cache_hit(text) TO authenticated;
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // --- Caching Logic ---
    if (!isGuestMode) {
      try {
        const cachePayload = {
          message,
          context,
          client_id: clientData?.id || null,
          userRole: userRole || null,
        };
        const requestHash = await getRequestHash(cachePayload);

        const { data: cached, error: cacheError } = await supabase
          .from('ai_cache')
          .select('response, model')
          .eq('request_hash', requestHash)
          .maybeSingle();

        if (cacheError) {
          console.warn('Cache lookup failed (non-critical):', cacheError.message);
        }
        
        if (cached) {
          console.log('✅ Cache hit!', { requestHash });

          // Asynchronously update hit count.
          supabase.rpc('increment_cache_hit', { hash_to_update: requestHash })
            .then(({ error }) => {
              if (error) console.warn('Failed to increment cache hit count:', error);
            });
          
          await logAIUsageEnhanced({
            userId,
            sessionId: sessionId || crypto.randomUUID(),
            model: cached.model,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            contextType: context,
            clientId: clientData?.id || null,
            responseTimeMs: 1,
            requestType: 'chat-cached',
          });

          return new Response(JSON.stringify({
            response: cached.response,
            context: context,
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            model: cached.model,
            responseTime: 1,
            isGuestMode,
            fromCache: true,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (e) {
        console.warn('Cache check threw an error (non-critical):', e.message);
      }
    }
    // --- End Caching Logic ---

    console.log('🧐 Cache miss, proceeding to generate new response.');

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
        
        // After successful generation and logging, store in cache
        const cachePayload = {
          message,
          context,
          client_id: clientData?.id || null,
          userRole: userRole || null,
        };
        const requestHash = await getRequestHash(cachePayload);

        supabase.from('ai_cache').insert({
          request_hash: requestHash,
          response: aiResponse,
          model: model,
          user_id: userId,
          client_id: clientData?.id || null,
        }).then(({ error: cacheInsertError }) => {
          if (cacheInsertError) {
            // UNIQUE constraint violation is expected if another request is in-flight. Not an error.
            if (cacheInsertError.code !== '23505') {
              console.warn('Cache insert failed (non-critical):', cacheInsertError.message);
            }
          } else {
            console.log('✅ Response cached successfully');
          }
        });

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
