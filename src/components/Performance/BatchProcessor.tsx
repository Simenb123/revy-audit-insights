import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, Zap } from 'lucide-react';
import { useBatchWidgetOperations } from '@/hooks/useOptimizedWidget';
import { logger } from '@/utils/logger';

interface BatchOperation<T> {
  id: string;
  name: string;
  items: T[];
  processor: (batch: T[]) => Promise<void> | void;
  batchSize?: number;
  delayMs?: number;
}

interface BatchProcessorProps<T> {
  operations: BatchOperation<T>[];
  onComplete?: (results: { [operationId: string]: boolean }) => void;
  onProgress?: (operationId: string, progress: number) => void;
  className?: string;
}

interface OperationState {
  id: string;
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  completed: boolean;
  error: string | null;
  estimatedTimeRemaining: number;
  itemsProcessed: number;
  totalItems: number;
}

export const BatchProcessor = memo(function BatchProcessor<T>({
  operations,
  onComplete,
  onProgress,
  className = '',
}: BatchProcessorProps<T>) {
  const [operationStates, setOperationStates] = useState<{ [id: string]: OperationState }>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const abortControllersRef = useRef<{ [id: string]: AbortController }>({});

  // Initialize operation states
  useEffect(() => {
    const initialStates = operations.reduce((acc, op) => {
      acc[op.id] = {
        id: op.id,
        isRunning: false,
        isPaused: false,
        progress: 0,
        completed: false,
        error: null,
        estimatedTimeRemaining: 0,
        itemsProcessed: 0,
        totalItems: op.items.length,
      };
      return acc;
    }, {} as { [id: string]: OperationState });

    setOperationStates(initialStates);
  }, [operations]);

  const updateOperationState = useCallback((
    operationId: string,
    updates: Partial<OperationState>
  ) => {
    setOperationStates(prev => ({
      ...prev,
      [operationId]: { ...prev[operationId], ...updates },
    }));

    if (updates.progress !== undefined) {
      onProgress?.(operationId, updates.progress);
    }
  }, [onProgress]);

  const processOperation = useCallback(async (operation: BatchOperation<T>) => {
    const { id, items, processor, batchSize = 50, delayMs = 0 } = operation;
    const abortController = new AbortController();
    abortControllersRef.current[id] = abortController;

    try {
      updateOperationState(id, {
        isRunning: true,
        error: null,
        progress: 0,
        itemsProcessed: 0,
      });

      const startTime = Date.now();
      let processedCount = 0;

      for (let i = 0; i < items.length; i += batchSize) {
        // Check if operation was aborted
        if (abortController.signal.aborted) {
          break;
        }

        const batch = items.slice(i, i + batchSize);
        
        await processor(batch);
        
        processedCount += batch.length;
        const progress = (processedCount / items.length) * 100;
        const elapsed = Date.now() - startTime;
        const estimatedTotal = (elapsed / processedCount) * items.length;
        const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);

        updateOperationState(id, {
          progress,
          itemsProcessed: processedCount,
          estimatedTimeRemaining,
        });

        // Add delay between batches if specified
        if (delayMs > 0 && i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      if (!abortController.signal.aborted) {
        updateOperationState(id, {
          isRunning: false,
          completed: true,
          progress: 100,
          estimatedTimeRemaining: 0,
        });

        logger.debug(`Batch operation ${id} completed successfully`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateOperationState(id, {
        isRunning: false,
        error: errorMessage,
      });

      logger.error(`Batch operation ${id} failed:`, errorMessage);
    } finally {
      delete abortControllersRef.current[id];
    }
  }, [updateOperationState]);

  const startOperation = useCallback(async (operationId: string) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return;

    await processOperation(operation);
  }, [operations, processOperation]);

  const stopOperation = useCallback((operationId: string) => {
    const abortController = abortControllersRef.current[operationId];
    if (abortController) {
      abortController.abort();
    }

    updateOperationState(operationId, {
      isRunning: false,
      isPaused: false,
    });
  }, [updateOperationState]);

  const startAllOperations = useCallback(async () => {
    setIsRunningAll(true);
    const results: { [operationId: string]: boolean } = {};

    try {
      // Run operations in parallel
      const promises = operations.map(async (operation) => {
        try {
          await processOperation(operation);
          results[operation.id] = true;
        } catch (error) {
          results[operation.id] = false;
        }
      });

      await Promise.allSettled(promises);
      onComplete?.(results);
    } finally {
      setIsRunningAll(false);
    }
  }, [operations, processOperation, onComplete]);

  const stopAllOperations = useCallback(() => {
    Object.keys(abortControllersRef.current).forEach(operationId => {
      stopOperation(operationId);
    });
    setIsRunningAll(false);
  }, [stopOperation]);

  const formatTime = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  const getStatusColor = useCallback((state: OperationState): "destructive" | "default" | "secondary" | "outline" => {
    if (state.error) return 'destructive';
    if (state.completed) return 'default';
    if (state.isRunning) return 'secondary';
    return 'outline';
  }, []);

  const getStatusIcon = useCallback((state: OperationState) => {
    if (state.error) return <Square className="w-3 h-3" />;
    if (state.completed) return <Zap className="w-3 h-3" />;
    if (state.isRunning) return <Play className="w-3 h-3" />;
    return <Pause className="w-3 h-3" />;
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Global Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Batch Operations</h3>
          <div className="flex gap-2">
            <Button
              onClick={startAllOperations}
              disabled={isRunningAll}
              size="sm"
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start All
            </Button>
            <Button
              onClick={stopAllOperations}
              disabled={!isRunningAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop All
            </Button>
          </div>
        </div>
      </Card>

      {/* Individual Operations */}
      <div className="space-y-3">
        {operations.map((operation) => {
          const state = operationStates[operation.id];
          if (!state) return null;

          return (
            <Card key={operation.id} className="p-4">
              <div className="space-y-3">
                {/* Operation Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{operation.name}</h4>
                    <Badge variant={getStatusColor(state)} className="flex items-center gap-1">
                      {getStatusIcon(state)}
                      {state.error ? 'Error' : state.completed ? 'Complete' : state.isRunning ? 'Running' : 'Ready'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startOperation(operation.id)}
                      disabled={state.isRunning || state.completed}
                      size="sm"
                      variant="outline"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => stopOperation(operation.id)}
                      disabled={!state.isRunning}
                      size="sm"
                      variant="outline"
                    >
                      <Square className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress value={state.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{state.itemsProcessed} / {state.totalItems} items</span>
                    {state.estimatedTimeRemaining > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(state.estimatedTimeRemaining)} remaining
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {state.error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {state.error}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

export default BatchProcessor;