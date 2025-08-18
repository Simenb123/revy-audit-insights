import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIAnalysisSession {
  id: string;
  client_id: string;
  data_version_id?: string;
  session_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress_percentage: number;
  current_step?: string;
  total_steps: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  analysis_config: any;
  result_data?: any;
  metadata?: any;
  created_by?: string;
  updated_at: string;
}

export interface CreateAIAnalysisRequest {
  clientId: string;
  dataVersionId?: string;
  sessionType: string;
  analysisConfig: any;
}

export const useAIAnalysisSessions = () => {
  const queryClient = useQueryClient();

  const createSession = useMutation({
    mutationFn: async (request: CreateAIAnalysisRequest) => {
      const { data, error } = await supabase
        .from('ai_analysis_sessions')
        .insert({
          client_id: request.clientId,
          data_version_id: request.dataVersionId,
          session_type: request.sessionType,
          analysis_config: request.analysisConfig,
          status: 'pending',
          total_steps: 5, // AI analysis has 5 main steps
          progress_percentage: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-analysis-sessions'] });
      toast.success('AI-analyse startet');
    },
    onError: (error) => {
      toast.error('Kunne ikke starte AI-analyse');
      console.error('Failed to create AI analysis session:', error);
    }
  });

  const updateSessionProgress = useMutation({
    mutationFn: async ({ 
      sessionId, 
      status,
      progressPercentage, 
      currentStep,
      errorMessage,
      resultData
    }: { 
      sessionId: string; 
      status?: string;
      progressPercentage?: number; 
      currentStep?: string;
      errorMessage?: string;
      resultData?: any;
    }) => {
      const updateData: any = {};
      
      if (status) updateData.status = status;
      if (progressPercentage !== undefined) updateData.progress_percentage = progressPercentage;
      if (currentStep) updateData.current_step = currentStep;
      if (errorMessage) updateData.error_message = errorMessage;
      if (resultData) updateData.result_data = resultData;
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('ai_analysis_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-analysis-sessions'] });
    }
  });

  const cancelSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('ai_analysis_sessions')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-analysis-sessions'] });
      toast.success('AI-analyse avbrutt');
    }
  });

  return {
    createSession,
    updateSessionProgress,
    cancelSession
  };
};

export const useAIAnalysisSessionsForClient = (clientId: string) => {
  return useQuery({
    queryKey: ['ai-analysis-sessions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analysis_sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as AIAnalysisSession[];
    },
    enabled: !!clientId
  });
};

export const useAIAnalysisSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['ai-analysis-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analysis_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as AIAnalysisSession;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      // Auto-refresh if session is running
      return query.state.data?.status === 'running' ? 2000 : false;
    }
  });
};

export const useAIAnalysisCache = () => {
  const queryClient = useQueryClient();

  const getFromCache = useCallback(async (clientId: string, versionId: string, analysisType: string = 'transaction_analysis') => {
    const { data, error } = await supabase
      .from('ai_analysis_cache')
      .select('*')
      .eq('client_id', clientId)
      .eq('data_version_id', versionId)
      .eq('analysis_type', analysisType)
      .gt('expires_at', new Date().toISOString())
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    
    // Update access stats if found
    if (data) {
      await supabase
        .from('ai_analysis_cache')
        .update({ 
          last_accessed: new Date().toISOString(),
          access_count: data.access_count + 1 
        })
        .eq('id', data.id);
    }

    return data;
  }, []);

  const saveToCache = useMutation({
    mutationFn: async ({
      clientId,
      versionId,
      analysisType = 'transaction_analysis',
      configHash,
      resultData,
      transactionCount,
      analysisDuration,
      confidenceScore = 0.85
    }: {
      clientId: string;
      versionId: string;
      analysisType?: string;
      configHash: string;
      resultData: any;
      transactionCount: number;
      analysisDuration?: number;
      confidenceScore?: number;
    }) => {
      const { data, error } = await supabase
        .from('ai_analysis_cache')
        .upsert({
          client_id: clientId,
          data_version_id: versionId,
          analysis_type: analysisType,
          config_hash: configHash,
          result_data: resultData,
          transaction_count: transactionCount,
          analysis_duration_ms: analysisDuration,
          confidence_score: confidenceScore,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          last_accessed: new Date().toISOString(),
          access_count: 1
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });

  return {
    getFromCache,
    saveToCache
  };
};