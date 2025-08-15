import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AITaskManager, AITaskResult } from '@/services/aiOrchestration/aiTaskManager';
import { Client } from '@/types/revio';
import { useToast } from '@/hooks/use-toast';

export interface AITaskStatus {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  result?: AITaskResult;
  error?: string;
}

export const useAIOrchestration = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<AITaskStatus[]>([
    { id: 'document-analysis', name: 'Dokumentanalyse', status: 'pending', progress: 0 },
    { id: 'predictive-insights', name: 'Prediktive Innsikter', status: 'pending', progress: 0 },
    { id: 'benchmarking', name: 'Benchmarking', status: 'pending', progress: 0 },
    { id: 'risk-assessment', name: 'Risikovurdering', status: 'pending', progress: 0 }
  ]);

  const taskManager = AITaskManager.getInstance();

  const updateTaskStatus = useCallback((taskId: string, updates: Partial<AITaskStatus>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  const resetTasks = useCallback(() => {
    setTasks(prev => prev.map(task => ({
      ...task,
      status: 'pending' as const,
      progress: 0,
      result: undefined as AITaskResult | undefined,
      error: undefined as string | undefined
    })));
  }, []);

  // Individual task mutations
  const documentAnalysisMutation = useMutation({
    mutationFn: async (client: Client) => {
      updateTaskStatus('document-analysis', { status: 'running', progress: 25 });
      const result = await taskManager.runDocumentAnalysis(client);
      return result;
    },
    onSuccess: (result) => {
      updateTaskStatus('document-analysis', { 
        status: 'completed', 
        progress: 100, 
        result 
      });
    },
    onError: (error) => {
      updateTaskStatus('document-analysis', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const predictiveAnalysisMutation = useMutation({
    mutationFn: async (client: Client) => {
      updateTaskStatus('predictive-insights', { status: 'running', progress: 25 });
      const result = await taskManager.runPredictiveAnalysis(client);
      return result;
    },
    onSuccess: (result) => {
      updateTaskStatus('predictive-insights', { 
        status: 'completed', 
        progress: 100, 
        result 
      });
    },
    onError: (error) => {
      updateTaskStatus('predictive-insights', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const benchmarkingMutation = useMutation({
    mutationFn: async (client: Client) => {
      updateTaskStatus('benchmarking', { status: 'running', progress: 25 });
      const result = await taskManager.runBenchmarkingAnalysis(client);
      return result;
    },
    onSuccess: (result) => {
      updateTaskStatus('benchmarking', { 
        status: 'completed', 
        progress: 100, 
        result 
      });
    },
    onError: (error) => {
      updateTaskStatus('benchmarking', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const riskAssessmentMutation = useMutation({
    mutationFn: async (client: Client) => {
      updateTaskStatus('risk-assessment', { status: 'running', progress: 25 });
      const result = await taskManager.runRiskAssessment(client);
      return result;
    },
    onSuccess: (result) => {
      updateTaskStatus('risk-assessment', { 
        status: 'completed', 
        progress: 100, 
        result 
      });
    },
    onError: (error) => {
      updateTaskStatus('risk-assessment', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Comprehensive analysis mutation
  const comprehensiveAnalysisMutation = useMutation({
    mutationFn: async (client: Client) => {
      resetTasks();
      toast({
        title: "Starter fullstendig AI-analyse",
        description: "Alle AI-komponenter aktiveres...",
      });

      const results = await taskManager.runComprehensiveAnalysis(
        client,
        (progress, taskName) => {
          // Update progress based on task name
          if (taskName === 'Dokumentanalyse') {
            updateTaskStatus('document-analysis', { status: 'running', progress });
          } else if (taskName === 'Prediktive Innsikter') {
            updateTaskStatus('predictive-insights', { status: 'running', progress });
          } else if (taskName === 'Benchmarking') {
            updateTaskStatus('benchmarking', { status: 'running', progress });
          } else if (taskName === 'Risikovurdering') {
            updateTaskStatus('risk-assessment', { status: 'running', progress });
          }
        }
      );

      // Update final results
      results.forEach((result, index) => {
        const taskIds = ['document-analysis', 'predictive-insights', 'benchmarking', 'risk-assessment'];
        const taskId = taskIds[index];
        if (taskId) {
          updateTaskStatus(taskId, {
            status: result.status === 'success' ? 'completed' : 'error',
            progress: 100,
            result: result.status === 'success' ? result : undefined,
            error: result.status === 'error' ? result.error : undefined
          });
        }
      });

      return results;
    },
    onSuccess: () => {
      toast({
        title: "AI-analyse fullført",
        description: "Alle komponenter har fullført analysen.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil i AI-analyse",
        description: error instanceof Error ? error.message : "Ukjent feil oppstod",
        variant: "destructive",
      });
    }
  });

  // Individual task runners
  const runDocumentAnalysis = useCallback((client: Client) => {
    documentAnalysisMutation.mutate(client);
  }, [documentAnalysisMutation]);

  const runPredictiveAnalysis = useCallback((client: Client) => {
    predictiveAnalysisMutation.mutate(client);
  }, [predictiveAnalysisMutation]);

  const runBenchmarking = useCallback((client: Client) => {
    benchmarkingMutation.mutate(client);
  }, [benchmarkingMutation]);

  const runRiskAssessment = useCallback((client: Client) => {
    riskAssessmentMutation.mutate(client);
  }, [riskAssessmentMutation]);

  const runFullAnalysis = useCallback((client: Client) => {
    comprehensiveAnalysisMutation.mutate(client);
  }, [comprehensiveAnalysisMutation]);

  const cancelAllTasks = useCallback(() => {
    taskManager.getRunningTasks().forEach(taskId => {
      taskManager.cancelTask(taskId);
    });
    resetTasks();
    toast({
      title: "Oppgaver avbrutt",
      description: "Alle pågående AI-oppgaver er avbrutt.",
    });
  }, [taskManager, resetTasks, toast]);

  const isAnyTaskRunning = tasks.some(task => task.status === 'running');
  const overallProgress = tasks.reduce((acc, task) => acc + task.progress, 0) / tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const errorTasks = tasks.filter(task => task.status === 'error').length;

  return {
    tasks,
    isAnyTaskRunning,
    overallProgress,
    completedTasks,
    errorTasks,
    runDocumentAnalysis,
    runPredictiveAnalysis,
    runBenchmarking,
    runRiskAssessment,
    runFullAnalysis,
    cancelAllTasks,
    resetTasks
  };
};