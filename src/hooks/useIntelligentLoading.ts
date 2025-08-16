import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: string;
  error: string | null;
  startTime: number;
  estimatedTimeRemaining: number;
}

interface UseIntelligentLoadingOptions {
  stages?: string[];
  estimatedDuration?: number;
  enableProgressEstimation?: boolean;
  onStageChange?: (stage: string) => void;
  onComplete?: (duration: number) => void;
  onError?: (error: string) => void;
}

export function useIntelligentLoading(options: UseIntelligentLoadingOptions = {}) {
  const {
    stages = ['Initializing', 'Loading', 'Processing', 'Finalizing'],
    estimatedDuration = 3000,
    enableProgressEstimation = true,
    onStageChange,
    onComplete,
    onError,
  } = options;

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: '',
    error: null,
    startTime: 0,
    estimatedTimeRemaining: 0,
  });

  const currentStageRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const stageTimingsRef = useRef<number[]>([]);

  const updateProgress = useCallback(() => {
    if (!loadingState.isLoading) return;

    const elapsed = Date.now() - loadingState.startTime;
    const stageProgress = Math.min(100, (elapsed / estimatedDuration) * 100);
    
    let totalProgress = 0;
    if (enableProgressEstimation) {
      const stageWeight = 100 / stages.length;
      const completedStages = currentStageRef.current;
      const currentStageProgress = Math.min(100, stageProgress);
      totalProgress = (completedStages * stageWeight) + (currentStageProgress * stageWeight / 100);
    } else {
      totalProgress = stageProgress;
    }

    const remainingTime = Math.max(0, estimatedDuration - elapsed);

    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, totalProgress),
      estimatedTimeRemaining: remainingTime,
    }));
  }, [loadingState.isLoading, loadingState.startTime, estimatedDuration, enableProgressEstimation, stages.length]);

  const startLoading = useCallback(async <T>(
    loadingFunction: () => Promise<T>,
    customStages?: string[]
  ): Promise<T> => {
    const stagesToUse = customStages || stages;
    const startTime = Date.now();
    
    setLoadingState({
      isLoading: true,
      progress: 0,
      stage: stagesToUse[0] || 'Loading',
      error: null,
      startTime,
      estimatedTimeRemaining: estimatedDuration,
    });

    currentStageRef.current = 0;
    stageTimingsRef.current = [];

    // Start progress updates
    intervalRef.current = setInterval(updateProgress, 100);

    try {
      onStageChange?.(stagesToUse[0] || 'Loading');
      
      const result = await loadingFunction();
      
      const duration = Date.now() - startTime;
      
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        stage: 'Complete',
        estimatedTimeRemaining: 0,
      }));

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      logger.debug(`Loading completed in ${duration}ms`);
      onComplete?.(duration);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Loading failed';
      
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        stage: 'Error',
        estimatedTimeRemaining: 0,
      }));

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      logger.error('Loading failed:', errorMessage);
      onError?.(errorMessage);
      
      throw error;
    }
  }, [stages, estimatedDuration, updateProgress, onStageChange, onComplete, onError]);

  const setStage = useCallback((stageIndex: number) => {
    if (stageIndex < 0 || stageIndex >= stages.length) return;
    
    const stageName = stages[stageIndex];
    const stageStartTime = Date.now();
    
    // Record timing for previous stage
    if (currentStageRef.current > 0) {
      const previousStageDuration = stageStartTime - loadingState.startTime;
      stageTimingsRef.current[currentStageRef.current - 1] = previousStageDuration;
    }

    currentStageRef.current = stageIndex;
    
    setLoadingState(prev => ({
      ...prev,
      stage: stageName,
    }));

    onStageChange?.(stageName);
    logger.debug(`Loading stage: ${stageName}`);
  }, [stages, loadingState.startTime, onStageChange]);

  const nextStage = useCallback(() => {
    const nextIndex = currentStageRef.current + 1;
    setStage(nextIndex);
  }, [setStage]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setLoadingState({
      isLoading: false,
      progress: 0,
      stage: '',
      error: null,
      startTime: 0,
      estimatedTimeRemaining: 0,
    });
    
    currentStageRef.current = 0;
    stageTimingsRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    loadingState,
    startLoading,
    setStage,
    nextStage,
    reset,
    isLoading: loadingState.isLoading,
    progress: loadingState.progress,
    stage: loadingState.stage,
    error: loadingState.error,
    estimatedTimeRemaining: loadingState.estimatedTimeRemaining,
  };
}

// Specialized hook for widget loading
export function useWidgetLoading() {
  const stages = [
    'Fetching data',
    'Processing data',
    'Rendering widget',
    'Applying animations'
  ];

  return useIntelligentLoading({
    stages,
    estimatedDuration: 2000,
    enableProgressEstimation: true,
  });
}

// Hook for dashboard loading
export function useDashboardLoading() {
  const stages = [
    'Loading configuration',
    'Fetching widgets',
    'Processing layouts',
    'Initializing components',
    'Finalizing dashboard'
  ];

  return useIntelligentLoading({
    stages,
    estimatedDuration: 5000,
    enableProgressEstimation: true,
  });
}