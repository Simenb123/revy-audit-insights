
import { supabase } from './supabase.ts';

export interface UsageLogData {
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  clientId?: string;
  responseTimeMs: number;
  sessionId?: string;
  contextType: string;
}

export async function logUsage(data: UsageLogData) {
  try {
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: data.userId,
        model: data.model,
        prompt_tokens: data.promptTokens,
        completion_tokens: data.completionTokens,
        total_tokens: data.totalTokens,
        estimated_cost_usd: data.estimatedCostUsd,
        client_id: data.clientId,
        response_time_ms: data.responseTimeMs,
        session_id: data.sessionId,
        context_type: data.contextType,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log AI usage:', error);
    } else {
      console.log('✅ AI usage logged successfully');
    }
  } catch (error) {
    console.error('Error logging AI usage:', error);
  }
}
