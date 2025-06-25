
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { RevyContext } from '@/types/revio';

interface RevyContextState {
  currentContext: RevyContext;
  clientId?: string;
  phase?: string;
  contextData?: any;
  previousContext?: RevyContext;
}

interface RevyContextAction {
  type: 'SET_CONTEXT' | 'UPDATE_CONTEXT_DATA' | 'RESET_CONTEXT';
  payload?: Partial<RevyContextState>;
}

const initialState: RevyContextState = {
  currentContext: 'general',
  contextData: {}
};

function revyContextReducer(state: RevyContextState, action: RevyContextAction): RevyContextState {
  switch (action.type) {
    case 'SET_CONTEXT':
      return {
        ...state,
        previousContext: state.currentContext,
        ...action.payload
      };
    case 'UPDATE_CONTEXT_DATA':
      return {
        ...state,
        contextData: {
          ...state.contextData,
          ...action.payload?.contextData
        }
      };
    case 'RESET_CONTEXT':
      return initialState;
    default:
      return state;
  }
}

const RevyContextContext = createContext<{
  state: RevyContextState;
  setContext: (context: RevyContext, data?: Partial<RevyContextState>) => void;
  updateContextData: (data: any) => void;
  resetContext: () => void;
} | undefined>(undefined);

export const RevyContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(revyContextReducer, initialState);

  const setContext = useCallback((context: RevyContext, data?: Partial<RevyContextState>) => {
    dispatch({
      type: 'SET_CONTEXT',
      payload: {
        currentContext: context,
        ...data
      }
    });
  }, []);

  const updateContextData = useCallback((data: any) => {
    dispatch({
      type: 'UPDATE_CONTEXT_DATA',
      payload: { contextData: data }
    });
  }, []);

  const resetContext = useCallback(() => {
    dispatch({ type: 'RESET_CONTEXT' });
  }, []);

  return (
    <RevyContextContext.Provider value={{
      state,
      setContext,
      updateContextData,
      resetContext
    }}>
      {children}
    </RevyContextContext.Provider>
  );
};

export const useRevyContext = () => {
  const context = useContext(RevyContextContext);
  if (!context) {
    throw new Error('useRevyContext must be used within a RevyContextProvider');
  }
  return context;
};
