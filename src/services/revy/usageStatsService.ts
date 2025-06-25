
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

// Get AI usage statistics for current user
export const getAIUsageStats = async (timeframe: 'day' | 'week' | 'month' = 'week') => {
  if (!isSupabaseConfigured || !supabase) {
    console.error("Supabase is not configured. Cannot load usage stats.");
    throw new Error("Supabase not initialized");
  }
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI usage stats:', error);
      throw error;
    }

    // Calculate summary statistics
    const summary = {
      totalRequests: logs?.length || 0,
      totalTokens: logs?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0,
      totalCost: logs?.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0) || 0,
      avgResponseTime: logs?.length ? 
        logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length : 0,
      modelUsage: logs?.reduce((acc, log) => {
        acc[log.model] = (acc[log.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      contextUsage: logs?.reduce((acc, log) => {
        const context = log.context_type || 'general';
        acc[context] = (acc[context] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    return {
      logs: logs || [],
      summary
    };
  } catch (error) {
    console.error('Error in getAIUsageStats:', error);
    throw error;
  }
};

// Get firm-wide AI usage statistics (admin only)
export const getFirmAIUsageStats = async (timeframe: 'day' | 'week' | 'month' = 'week') => {
  if (!isSupabaseConfigured || !supabase) {
    console.error("Supabase is not configured. Cannot load usage stats.");
    throw new Error("Supabase not initialized");
  }
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          user_role
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching firm AI usage stats:', error);
      throw error;
    }

    return logs || [];
  } catch (error) {
    console.error('Error in getFirmAIUsageStats:', error);
    throw error;
  }
};
