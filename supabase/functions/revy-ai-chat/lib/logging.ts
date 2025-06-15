
import { supabase } from './supabase.ts';

// Enhanced usage logging
export async function logAIUsageEnhanced(params: {
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
