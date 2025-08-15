import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useLazyLoad } from '@/hooks/useLazyLoad';

interface LoadingTask {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  dependencies?: string[];
  component?: string;
  data?: any;
  status: 'pending' | 'loading' | 'completed' | 'failed' | 'cancelled';
  startedAt?: number;
  completedAt?: number;
  error?: Error;
}

interface LoadingManagerState {
  tasks: Record<string, LoadingTask>;
  queue: string[];
  activeTasks: string[];
  maxConcurrent: number;
  priorityWeights: Record<LoadingTask['priority'], number>;
  totalBandwidth: number;
  usedBandwidth: number;
}

type LoadingAction =
  | { type: 'ADD_TASK'; payload: Omit<LoadingTask, 'status'> }
  | { type: 'START_TASK'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: { taskId: string; result?: any } }
  | { type: 'FAIL_TASK'; payload: { taskId: string; error: Error } }
  | { type: 'CANCEL_TASK'; payload: string }
  | { type: 'UPDATE_BANDWIDTH'; payload: number }
  | { type: 'SET_MAX_CONCURRENT'; payload: number };

const initialState: LoadingManagerState = {
  tasks: {},
  queue: [],
  activeTasks: [],
  maxConcurrent: 3,
  priorityWeights: { critical: 10, high: 5, medium: 3, low: 1 },
  totalBandwidth: 100,
  usedBandwidth: 0
};

function loadingReducer(state: LoadingManagerState, action: LoadingAction): LoadingManagerState {
  switch (action.type) {
    case 'ADD_TASK': {
      const task: LoadingTask = { ...action.payload, status: 'pending' };
      const sortedQueue = [...state.queue, task.id].sort((a, b) => {
        const taskA = state.tasks[a] || task;
        const taskB = state.tasks[b] || task;
        return state.priorityWeights[taskB.priority] - state.priorityWeights[taskA.priority];
      });

      return {
        ...state,
        tasks: { ...state.tasks, [task.id]: task },
        queue: sortedQueue
      };
    }

    case 'START_TASK': {
      const task = state.tasks[action.payload];
      if (!task || task.status !== 'pending') return state;

      const bandwidth = Math.min(30, state.totalBandwidth - state.usedBandwidth);
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload]: { ...task, status: 'loading', startedAt: Date.now() }
        },
        queue: state.queue.filter(id => id !== action.payload),
        activeTasks: [...state.activeTasks, action.payload],
        usedBandwidth: state.usedBandwidth + bandwidth
      };
    }

    case 'COMPLETE_TASK': {
      const task = state.tasks[action.payload.taskId];
      if (!task) return state;

      const bandwidth = task.priority === 'critical' ? 30 : 
                      task.priority === 'high' ? 25 : 
                      task.priority === 'medium' ? 20 : 15;

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: { 
            ...task, 
            status: 'completed', 
            completedAt: Date.now(),
            data: action.payload.result
          }
        },
        activeTasks: state.activeTasks.filter(id => id !== action.payload.taskId),
        usedBandwidth: Math.max(0, state.usedBandwidth - bandwidth)
      };
    }

    case 'FAIL_TASK': {
      const task = state.tasks[action.payload.taskId];
      if (!task) return state;

      const bandwidth = 20; // Average bandwidth

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: { 
            ...task, 
            status: 'failed', 
            completedAt: Date.now(),
            error: action.payload.error
          }
        },
        activeTasks: state.activeTasks.filter(id => id !== action.payload.taskId),
        usedBandwidth: Math.max(0, state.usedBandwidth - bandwidth)
      };
    }

    case 'CANCEL_TASK': {
      const task = state.tasks[action.payload];
      if (!task) return state;

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload]: { ...task, status: 'cancelled' }
        },
        queue: state.queue.filter(id => id !== action.payload),
        activeTasks: state.activeTasks.filter(id => id !== action.payload)
      };
    }

    case 'UPDATE_BANDWIDTH':
      return { ...state, totalBandwidth: action.payload };

    case 'SET_MAX_CONCURRENT':
      return { ...state, maxConcurrent: action.payload };

    default:
      return state;
  }
}

interface SmartLoadingContextType {
  state: LoadingManagerState;
  addTask: (task: Omit<LoadingTask, 'status'>) => void;
  cancelTask: (taskId: string) => void;
  getTaskStatus: (taskId: string) => LoadingTask['status'];
  getLoadingStats: () => {
    total: number;
    pending: number;
    loading: number;
    completed: number;
    failed: number;
    bandwidthUsage: number;
  };
}

const SmartLoadingContext = createContext<SmartLoadingContextType | undefined>(undefined);

export function SmartLoadingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(loadingReducer, initialState);

  const addTask = useCallback((task: Omit<LoadingTask, 'status'>) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    dispatch({ type: 'CANCEL_TASK', payload: taskId });
  }, []);

  const getTaskStatus = useCallback((taskId: string): LoadingTask['status'] => {
    return state.tasks[taskId]?.status || 'pending';
  }, [state.tasks]);

  const getLoadingStats = useCallback(() => {
    const tasks = Object.values(state.tasks);
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      loading: tasks.filter(t => t.status === 'loading').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      bandwidthUsage: (state.usedBandwidth / state.totalBandwidth) * 100
    };
  }, [state]);

  // Process queue
  useEffect(() => {
    const processQueue = async () => {
      if (
        state.queue.length === 0 || 
        state.activeTasks.length >= state.maxConcurrent ||
        state.usedBandwidth >= state.totalBandwidth
      ) {
        return;
      }

      const nextTaskId = state.queue[0];
      const task = state.tasks[nextTaskId];
      
      if (!task || task.status !== 'pending') return;

      // Check dependencies
      if (task.dependencies?.some(depId => {
        const dep = state.tasks[depId];
        return !dep || dep.status !== 'completed';
      })) {
        return; // Dependencies not ready
      }

      dispatch({ type: 'START_TASK', payload: nextTaskId });

      try {
        // Simulate task execution
        await new Promise(resolve => setTimeout(resolve, task.estimatedTime));
        dispatch({ type: 'COMPLETE_TASK', payload: { taskId: nextTaskId } });
      } catch (error) {
        dispatch({ type: 'FAIL_TASK', payload: { taskId: nextTaskId, error: error as Error } });
      }
    };

    processQueue();
  }, [state.queue, state.activeTasks, state.maxConcurrent, state.usedBandwidth, state.totalBandwidth, state.tasks]);

  // Adjust bandwidth based on network conditions
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateBandwidth = () => {
        const effectiveType = connection.effectiveType;
        const bandwidth = effectiveType === '4g' ? 100 :
                         effectiveType === '3g' ? 50 :
                         effectiveType === '2g' ? 25 : 75;
        dispatch({ type: 'UPDATE_BANDWIDTH', payload: bandwidth });
      };

      updateBandwidth();
      connection.addEventListener('change', updateBandwidth);
      
      return () => connection.removeEventListener('change', updateBandwidth);
    }
  }, []);

  const contextValue: SmartLoadingContextType = {
    state,
    addTask,
    cancelTask,
    getTaskStatus,
    getLoadingStats
  };

  return (
    <SmartLoadingContext.Provider value={contextValue}>
      {children}
    </SmartLoadingContext.Provider>
  );
}

export function useSmartLoading() {
  const context = useContext(SmartLoadingContext);
  if (!context) {
    throw new Error('useSmartLoading must be used within SmartLoadingProvider');
  }
  return context;
}

// Component for smart lazy loading
interface SmartLazyComponentProps {
  taskId: string;
  priority?: LoadingTask['priority'];
  estimatedTime?: number;
  dependencies?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function SmartLazyComponent({
  taskId,
  priority = 'medium',
  estimatedTime = 1000,
  dependencies = [],
  children,
  fallback,
  className
}: SmartLazyComponentProps) {
  const { addTask, getTaskStatus } = useSmartLoading();
  const { elementRef, hasBeenVisible } = useLazyLoad<HTMLDivElement>({ threshold: 0.1 });
  const [hasAddedTask, setHasAddedTask] = React.useState(false);

  const status = getTaskStatus(taskId);

  React.useEffect(() => {
    if (hasBeenVisible && !hasAddedTask) {
      addTask({
        id: taskId,
        priority,
        estimatedTime,
        dependencies,
        component: 'SmartLazyComponent'
      });
      setHasAddedTask(true);
    }
  }, [hasBeenVisible, hasAddedTask, addTask, taskId, priority, estimatedTime, dependencies]);

  const shouldRender = status === 'completed' || (hasBeenVisible && status === 'loading');

  return (
    <div ref={elementRef} className={className}>
      {shouldRender ? children : (fallback || <div className="h-32 bg-muted animate-pulse rounded" />)}
    </div>
  );
}