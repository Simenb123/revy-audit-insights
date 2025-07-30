import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AnalysisSession {
  id: string;
  client_id: string;
  session_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data_version_id?: string;
  analysis_config: any;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  progress_percentage: number;
  created_by?: string;
}

export interface CreateAnalysisSessionRequest {
  clientId: string;
  sessionType: string;
  analysisConfig: any;
  dataVersionId?: string;
}

export const useAnalysisSessions = () => {
  const queryClient = useQueryClient();

  const createSession = useMutation({
    mutationFn: async (request: CreateAnalysisSessionRequest) => {
      const { data, error } = await supabase
        .from('analysis_sessions')
        .insert({
          client_id: request.clientId,
          session_type: request.sessionType,
          analysis_config: request.analysisConfig,
          data_version_id: request.dataVersionId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-sessions'] });
      toast.success('Analysesessjon opprettet');
    },
    onError: (error) => {
      toast.error('Kunne ikke opprette analysesessjon');
      console.error('Failed to create analysis session:', error);
    }
  });

  const updateSessionStatus = useMutation({
    mutationFn: async ({ 
      sessionId, 
      status, 
      progressPercentage, 
      errorMessage 
    }: { 
      sessionId: string; 
      status: string; 
      progressPercentage?: number; 
      errorMessage?: string;
    }) => {
      const updateData: any = { status };
      
      if (progressPercentage !== undefined) {
        updateData.progress_percentage = progressPercentage;
      }
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { data, error } = await supabase
        .from('analysis_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-sessions'] });
    }
  });

  return {
    createSession,
    updateSessionStatus
  };
};

export const useAnalysisSessionsForClient = (clientId: string) => {
  return useQuery({
    queryKey: ['analysis-sessions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as AnalysisSession[];
    },
    enabled: !!clientId
  });
};

export const useAnalysisResults = (sessionId: string) => {
  return useQuery({
    queryKey: ['analysis-results', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_results_v2')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId
  });
};