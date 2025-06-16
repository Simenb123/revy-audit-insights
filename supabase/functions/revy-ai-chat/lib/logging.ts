
import { supabase } from './supabase.ts';

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
    // Calculate cost using the corrected model names
    const estimatedCost = calculateTokenCost(
      params.model,
      params.promptTokens,
      params.completionTokens
    );

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
        context_type: params.contextType,
        client_id: params.clientId,
        response_time_ms: params.responseTimeMs,
        request_type: params.requestType,
        error_message: params.errorMessage || null
      });

    if (error) {
      console.error('Failed to log AI usage:', error);
    }
  } catch (error) {
    console.error('Error in logAIUsageEnhanced:', error);
  }
}

function calculateTokenCost(model: string, promptTokens: number, completionTokens: number): number {
  let promptCostPer1k: number;
  let completionCostPer1k: number;

  // Updated pricing for correct OpenAI models
  switch (model) {
    case 'gpt-4o-mini':
      promptCostPer1k = 0.00015;
      completionCostPer1k = 0.0006;
      break;
    case 'gpt-4o':
      promptCostPer1k = 0.005;
      completionCostPer1k = 0.015;
      break;
    case 'gpt-4':
      promptCostPer1k = 0.03;
      completionCostPer1k = 0.06;
      break;
    default:
      // Default to gpt-4o-mini pricing
      promptCostPer1k = 0.00015;
      completionCostPer1k = 0.0006;
  }

  const totalCost = (promptTokens * promptCostPer1k / 1000.0) + 
                    (completionTokens * completionCostPer1k / 1000.0);

  return totalCost;
}
