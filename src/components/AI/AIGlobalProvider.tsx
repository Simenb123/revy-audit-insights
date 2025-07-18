import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { RevyContext } from '@/types/revio';
import { AIRevyVariant } from '@/hooks/useAIRevyVariants';
import { logger } from '@/utils/logger';

interface AIGlobalState {
  // Core session management
  currentSession: string | null;
  isStreaming: boolean;
  isProcessing: boolean;
  
  // Context & variant management
  currentContext: RevyContext;
  selectedVariant: AIRevyVariant | null;
  contextData: any;
  
  // Cache & performance
  responseCache: Map<string, CachedResponse>;
  recentQueries: string[];
  
  // Error & status
  lastError: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  // Real-time state
  activeUsers: string[];
  sharedContext: any;
}

interface CachedResponse {
  response: string;
  timestamp: number;
  expiresAt: number;
  tags: string[];
  variant: string;
}

interface AIAction {
  type: 'SET_SESSION' | 'SET_CONTEXT' | 'SET_VARIANT' | 'SET_STREAMING' | 
        'SET_PROCESSING' | 'ADD_CACHE' | 'SET_ERROR' | 'UPDATE_CONNECTION' |
        'ADD_QUERY' | 'UPDATE_SHARED_CONTEXT' | 'RESET_STATE';
  payload?: any;
}

const initialState: AIGlobalState = {
  currentSession: null,
  isStreaming: false,
  isProcessing: false,
  currentContext: 'general',
  selectedVariant: null,
  contextData: {},
  responseCache: new Map(),
  recentQueries: [],
  lastError: null,
  connectionStatus: 'disconnected',
  activeUsers: [],
  sharedContext: {}
};

const aiGlobalReducer = (state: AIGlobalState, action: AIAction): AIGlobalState => {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, currentSession: action.payload };
      
    case 'SET_CONTEXT':
      return { 
        ...state, 
        currentContext: action.payload.context,
        contextData: { ...state.contextData, ...action.payload.data }
      };
      
    case 'SET_VARIANT':
      return { ...state, selectedVariant: action.payload };
      
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };
      
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
      
    case 'ADD_CACHE':
      const newCache = new Map(state.responseCache);
      newCache.set(action.payload.key, action.payload.response);
      // Cleanup old entries (keep last 50)
      if (newCache.size > 50) {
        const oldestKey = Array.from(newCache.keys())[0];
        newCache.delete(oldestKey);
      }
      return { ...state, responseCache: newCache };
      
    case 'SET_ERROR':
      return { ...state, lastError: action.payload };
      
    case 'UPDATE_CONNECTION':
      return { ...state, connectionStatus: action.payload };
      
    case 'ADD_QUERY':
      const newQueries = [action.payload, ...state.recentQueries].slice(0, 10);
      return { ...state, recentQueries: newQueries };
      
    case 'UPDATE_SHARED_CONTEXT':
      return { ...state, sharedContext: { ...state.sharedContext, ...action.payload } };
      
    case 'RESET_STATE':
      return { ...initialState, connectionStatus: state.connectionStatus };
      
    default:
      return state;
  }
};

const AIGlobalContext = createContext<{
  state: AIGlobalState;
  
  // Session management
  startSession: () => Promise<string>;
  endSession: () => void;
  
  // Context & variant
  setContext: (context: RevyContext, data?: any) => void;
  setVariant: (variant: AIRevyVariant) => void;
  
  // AI interactions
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<string>;
  
  // Cache management
  getCachedResponse: (key: string) => CachedResponse | null;
  preloadContext: (context: RevyContext, clientId?: string) => Promise<void>;
  
  // Real-time features
  shareContext: (data: any) => void;
  
  // Utilities
  clearError: () => void;
  resetState: () => void;
} | undefined>(undefined);

interface SendMessageOptions {
  clientData?: any;
  streaming?: boolean;
  priority?: 'low' | 'normal' | 'high';
  useCache?: boolean;
}

export const AIGlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiGlobalReducer, initialState);
  const { session } = useAuth();

  // Initialize connection on mount
  useEffect(() => {
    if (session) {
      dispatch({ type: 'UPDATE_CONNECTION', payload: 'connected' });
      startSession();
    } else {
      dispatch({ type: 'UPDATE_CONNECTION', payload: 'disconnected' });
    }
  }, [session]);

  // Session management
  const startSession = useCallback(async (): Promise<string> => {
    const sessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'SET_SESSION', payload: sessionId });
    
    logger.log('AI Global: Session started', sessionId);
    return sessionId;
  }, []);

  const endSession = useCallback(() => {
    dispatch({ type: 'SET_SESSION', payload: null });
    dispatch({ type: 'SET_STREAMING', payload: false });
    dispatch({ type: 'SET_PROCESSING', payload: false });
    logger.log('AI Global: Session ended');
  }, []);

  // Context & variant management
  const setContext = useCallback((context: RevyContext, data?: any) => {
    dispatch({ 
      type: 'SET_CONTEXT', 
      payload: { context, data } 
    });
    
    // Auto-preload context if available
    if (data?.clientId) {
      preloadContext(context, data.clientId);
    }
    
    logger.log('AI Global: Context set', { context, hasData: !!data });
  }, []);

  const setVariant = useCallback((variant: AIRevyVariant) => {
    dispatch({ type: 'SET_VARIANT', payload: variant });
    logger.log('AI Global: Variant selected', variant.name);
  }, []);

  // Cache management
  const getCachedResponse = useCallback((key: string): CachedResponse | null => {
    const cached = state.responseCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }
    return null;
  }, [state.responseCache]);

  const setCachedResponse = useCallback((key: string, response: string, tags: string[] = []) => {
    const cachedResponse: CachedResponse = {
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      tags,
      variant: state.selectedVariant?.name || 'default'
    };
    dispatch({ type: 'ADD_CACHE', payload: { key, response: cachedResponse } });
  }, [state.selectedVariant]);

  // Preload context for better performance
  const preloadContext = useCallback(async (context: RevyContext, clientId?: string) => {
    try {
      logger.log('AI Global: Preloading context', { context, clientId });
      
      // Preload based on context type
      switch (context) {
        case 'client-detail':
          if (clientId) {
            // Preload client data and recent documents
            const [clientResult, docsResult] = await Promise.all([
              supabase.from('clients').select('*').eq('id', clientId).single(),
              supabase.from('client_documents_files')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(5)
            ]);
            
            dispatch({ 
              type: 'UPDATE_SHARED_CONTEXT', 
              payload: { 
                clientData: clientResult.data,
                recentDocuments: docsResult.data 
              } 
            });
          }
          break;
          
        case 'knowledge':
          // Preload recent articles
          const articlesResult = await supabase
            .from('knowledge_articles')
            .select('*')
            .eq('status', 'published')
            .order('updated_at', { ascending: false })
            .limit(10);
            
          dispatch({ 
            type: 'UPDATE_SHARED_CONTEXT', 
            payload: { recentArticles: articlesResult.data } 
          });
          break;
      }
    } catch (error) {
      logger.error('AI Global: Context preload failed', error);
    }
  }, []);

  // Enhanced AI message sending with streaming support
  const sendMessage = useCallback(async (
    message: string, 
    options: SendMessageOptions = {}
  ): Promise<string> => {
    const { clientData, streaming = false, priority = 'normal', useCache = true } = options;
    
    dispatch({ type: 'SET_PROCESSING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'ADD_QUERY', payload: message });
    
    if (streaming) {
      dispatch({ type: 'SET_STREAMING', payload: true });
    }

    try {
      // Check cache first if enabled
      const cacheKey = JSON.stringify({
        message,
        context: state.currentContext,
        variant: state.selectedVariant?.name,
        clientId: clientData?.id
      });

      if (useCache) {
        const cached = getCachedResponse(cacheKey);
        if (cached) {
          logger.log('AI Global: Cache hit', { cacheKey: cacheKey.substring(0, 50) });
          return cached.response;
        }
      }

      // Prepare request payload with enhanced context
      const payload = {
        message,
        context: state.currentContext,
        selectedVariant: state.selectedVariant,
        clientData: clientData || state.sharedContext.clientData,
        sessionId: state.currentSession,
        userId: session?.user?.id,
        history: [] as any[], // TODO: Implement history management
        contextData: {
          ...state.contextData,
          ...state.sharedContext,
          priority
        }
      };

      logger.log('AI Global: Sending message', {
        messageLength: message.length,
        context: state.currentContext,
        variant: state.selectedVariant?.name,
        hasClientData: !!(clientData || state.sharedContext.clientData),
        streaming,
        priority
      });

      // Call AI function
      const response = await supabase.functions.invoke('revy-ai-chat', {
        body: payload
      });

      if (response.error) {
        throw new Error(response.error.message || 'AI request failed');
      }

      const aiResponse = response.data?.response;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Cache successful response
      if (useCache) {
        const tags = extractTagsFromResponse(aiResponse);
        setCachedResponse(cacheKey, aiResponse, tags);
      }

      logger.log('AI Global: Message sent successfully', {
        responseLength: aiResponse.length,
        cached: useCache
      });

      return aiResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logger.error('AI Global: Send message failed', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
      dispatch({ type: 'SET_STREAMING', payload: false });
    }
  }, [state, session, getCachedResponse, setCachedResponse]);

  // Real-time context sharing
  const shareContext = useCallback((data: any) => {
    dispatch({ type: 'UPDATE_SHARED_CONTEXT', payload: data });
    logger.log('AI Global: Context shared', Object.keys(data));
  }, []);

  // Utilities
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    logger.log('AI Global: State reset');
  }, []);

  const contextValue = {
    state,
    startSession,
    endSession,
    setContext,
    setVariant,
    sendMessage,
    getCachedResponse,
    preloadContext,
    shareContext,
    clearError,
    resetState
  };

  return (
    <AIGlobalContext.Provider value={contextValue}>
      {children}
    </AIGlobalContext.Provider>
  );
};

// Helper function to extract tags from AI response
function extractTagsFromResponse(response: string): string[] {
  const tagMatch = response.match(/🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*(.+?)(?:\n|$)/);
  if (tagMatch) {
    return tagMatch[1].split(',').map(tag => tag.trim()).filter(Boolean);
  }
  return [];
}

export const useAIGlobal = () => {
  const context = useContext(AIGlobalContext);
  if (!context) {
    throw new Error('useAIGlobal must be used within AIGlobalProvider');
  }
  return context;
};
