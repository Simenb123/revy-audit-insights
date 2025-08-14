import { useState, useCallback, useRef } from 'react';

export interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: string;
  subSteps?: AnalysisStep[];
}

export interface AnalysisProgress {
  currentStep: string | null;
  steps: AnalysisStep[];
  overallProgress: number;
  isRunning: boolean;
  startTime: number | null;
  estimatedTimeRemaining: number | null;
}

export function useAnalysisProgress() {
  const [progress, setProgress] = useState<AnalysisProgress>({
    currentStep: null,
    steps: [],
    overallProgress: 0,
    isRunning: false,
    startTime: null,
    estimatedTimeRemaining: null
  });

  const stepTimings = useRef<Record<string, number[]>>({});

  const initializeProgress = useCallback((steps: Omit<AnalysisStep, 'status' | 'progress'>[]) => {
    const initialSteps: AnalysisStep[] = steps.map(step => ({
      ...step,
      status: 'pending',
      progress: 0
    }));

    setProgress({
      currentStep: null,
      steps: initialSteps,
      overallProgress: 0,
      isRunning: false,
      startTime: null,
      estimatedTimeRemaining: null
    });
  }, []);

  const startStep = useCallback((stepId: string) => {
    const now = Date.now();
    
    setProgress(prev => {
      const updatedSteps = prev.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            status: 'running' as const,
            startTime: now,
            progress: 0
          };
        }
        return step;
      });

      // Calculate estimated time remaining based on historical data
      const remainingSteps = updatedSteps.filter(s => s.status === 'pending' || s.status === 'running');
      const avgTime = stepTimings.current[stepId]?.reduce((a, b) => a + b, 0) / (stepTimings.current[stepId]?.length || 1) || 30000;
      const estimatedTimeRemaining = remainingSteps.length * avgTime;

      return {
        ...prev,
        currentStep: stepId,
        steps: updatedSteps,
        isRunning: true,
        startTime: prev.startTime || now,
        estimatedTimeRemaining
      };
    });
  }, []);

  const updateStepProgress = useCallback((stepId: string, progress: number) => {
    setProgress(prev => {
      const updatedSteps = prev.steps.map(step => {
        if (step.id === stepId) {
          return { ...step, progress: Math.max(0, Math.min(100, progress)) };
        }
        return step;
      });

      const overallProgress = updatedSteps.reduce((sum, step) => sum + step.progress, 0) / updatedSteps.length;

      return {
        ...prev,
        steps: updatedSteps,
        overallProgress
      };
    });
  }, []);

  const completeStep = useCallback((stepId: string) => {
    const now = Date.now();
    
    setProgress(prev => {
      const updatedSteps = prev.steps.map(step => {
        if (step.id === stepId) {
          const duration = step.startTime ? now - step.startTime : 0;
          
          // Store timing for future estimates
          if (!stepTimings.current[stepId]) {
            stepTimings.current[stepId] = [];
          }
          stepTimings.current[stepId].push(duration);
          
          // Keep only last 10 timings for moving average
          if (stepTimings.current[stepId].length > 10) {
            stepTimings.current[stepId] = stepTimings.current[stepId].slice(-10);
          }

          return {
            ...step,
            status: 'completed' as const,
            progress: 100,
            endTime: now
          };
        }
        return step;
      });

      const overallProgress = updatedSteps.reduce((sum, step) => sum + step.progress, 0) / updatedSteps.length;
      const allCompleted = updatedSteps.every(step => step.status === 'completed');

      return {
        ...prev,
        steps: updatedSteps,
        overallProgress,
        isRunning: !allCompleted,
        currentStep: allCompleted ? null : prev.currentStep
      };
    });
  }, []);

  const failStep = useCallback((stepId: string, error: string) => {
    setProgress(prev => {
      const updatedSteps = prev.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            status: 'error' as const,
            error,
            endTime: Date.now()
          };
        }
        return step;
      });

      return {
        ...prev,
        steps: updatedSteps,
        isRunning: false,
        currentStep: null
      };
    });
  }, []);

  const reset = useCallback(() => {
    setProgress({
      currentStep: null,
      steps: [],
      overallProgress: 0,
      isRunning: false,
      startTime: null,
      estimatedTimeRemaining: null
    });
  }, []);

  const getStepDuration = useCallback((stepId: string): number | null => {
    const step = progress.steps.find(s => s.id === stepId);
    if (!step?.startTime) return null;
    
    const endTime = step.endTime || Date.now();
    return endTime - step.startTime;
  }, [progress.steps]);

  const getTotalDuration = useCallback((): number | null => {
    if (!progress.startTime) return null;
    
    const allCompleted = progress.steps.every(step => step.status === 'completed');
    const endTime = allCompleted 
      ? Math.max(...progress.steps.map(step => step.endTime || 0))
      : Date.now();
    
    return endTime - progress.startTime;
  }, [progress.startTime, progress.steps]);

  return {
    progress,
    initializeProgress,
    startStep,
    updateStepProgress,
    completeStep,
    failStep,
    reset,
    getStepDuration,
    getTotalDuration
  };
}
