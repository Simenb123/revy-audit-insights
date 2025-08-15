import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface DisclosureLevel {
  id: string;
  label: string;
  description?: string;
  fields: string[];
  minItems?: number;
  maxItems?: number;
}

export interface ProgressiveDisclosureConfig {
  levels: DisclosureLevel[];
  defaultLevel?: string;
  storageKey?: string;
  autoAdvance?: boolean;
}

export interface DisclosureState {
  currentLevel: string;
  isExpanded: boolean;
  expandedSections: Set<string>;
  userPreferences: Record<string, boolean>;
}

export function useProgressiveDisclosure(config: ProgressiveDisclosureConfig) {
  const { levels, defaultLevel, storageKey = 'disclosure-state', autoAdvance = true } = config;
  
  const [storedState, setStoredState] = useLocalStorage<{
    currentLevel?: string;
    isExpanded?: boolean;
    expandedSections?: string[];
    userPreferences?: Record<string, boolean>;
  }>(storageKey, {});
  
  const [state, setState] = useState<DisclosureState>(() => ({
    currentLevel: storedState.currentLevel || defaultLevel || levels[0]?.id || 'basic',
    isExpanded: storedState.isExpanded || false,
    expandedSections: new Set(storedState.expandedSections || []),
    userPreferences: storedState.userPreferences || {}
  }));

  // Update localStorage when state changes
  const updateStoredState = useCallback((newState: Partial<DisclosureState>) => {
    setStoredState(current => ({
      ...current,
      ...newState,
      expandedSections: newState.expandedSections ? Array.from(newState.expandedSections) : current.expandedSections
    }));
  }, [setStoredState]);

  const currentLevelConfig = useMemo(() => {
    return levels.find(level => level.id === state.currentLevel) || levels[0];
  }, [levels, state.currentLevel]);

  const availableFields = useMemo(() => {
    if (state.isExpanded) {
      // Return all fields when expanded
      return levels.flatMap(level => level.fields);
    }
    return currentLevelConfig?.fields || [];
  }, [currentLevelConfig, state.isExpanded, levels]);

  const setLevel = useCallback((levelId: string) => {
    const newState = { ...state, currentLevel: levelId };
    setState(newState);
    updateStoredState(newState);
  }, [state, updateStoredState]);

  const toggleExpansion = useCallback(() => {
    const newState = { ...state, isExpanded: !state.isExpanded };
    setState(newState);
    updateStoredState(newState);
  }, [state, updateStoredState]);

  const toggleSection = useCallback((sectionId: string) => {
    const newExpandedSections = new Set(state.expandedSections);
    if (newExpandedSections.has(sectionId)) {
      newExpandedSections.delete(sectionId);
    } else {
      newExpandedSections.add(sectionId);
    }
    
    const newState = { ...state, expandedSections: newExpandedSections };
    setState(newState);
    updateStoredState(newState);
  }, [state, updateStoredState]);

  const setUserPreference = useCallback((key: string, value: boolean) => {
    const newPreferences = { ...state.userPreferences, [key]: value };
    const newState = { ...state, userPreferences: newPreferences };
    setState(newState);
    updateStoredState(newState);
  }, [state, updateStoredState]);

  const shouldShowField = useCallback((fieldId: string) => {
    // Always show if expanded
    if (state.isExpanded) return true;
    
    // Show if in current level
    if (availableFields.includes(fieldId)) return true;
    
    // Show if user specifically enabled it
    if (state.userPreferences[fieldId] === true) return true;
    
    return false;
  }, [state.isExpanded, availableFields, state.userPreferences]);

  const shouldShowSection = useCallback((sectionId: string) => {
    return state.expandedSections.has(sectionId) || state.isExpanded;
  }, [state.expandedSections, state.isExpanded]);

  const getRecommendedLevel = useCallback((data: any) => {
    // Auto-advance logic based on data complexity
    if (!autoAdvance || !data) return state.currentLevel;
    
    const dataKeys = Object.keys(data);
    const complexity = dataKeys.length;
    
    if (complexity <= 5) return levels[0]?.id || 'basic';
    if (complexity <= 15) return levels[1]?.id || 'intermediate';
    return levels[2]?.id || 'advanced';
  }, [autoAdvance, state.currentLevel, levels]);

  const optimizeForData = useCallback((data: any) => {
    const recommendedLevel = getRecommendedLevel(data);
    if (recommendedLevel !== state.currentLevel) {
      setLevel(recommendedLevel);
    }
  }, [getRecommendedLevel, state.currentLevel, setLevel]);

  return {
    // Current state
    currentLevel: state.currentLevel,
    currentLevelConfig,
    isExpanded: state.isExpanded,
    availableFields,
    
    // Actions
    setLevel,
    toggleExpansion,
    toggleSection,
    setUserPreference,
    optimizeForData,
    
    // Helpers
    shouldShowField,
    shouldShowSection,
    getRecommendedLevel,
    
    // Meta
    levels,
    state
  };
}

// Predefined configurations for common use cases
export const commonDisclosureConfigs = {
  dataTable: {
    levels: [
      {
        id: 'basic',
        label: 'Grunnleggende',
        description: 'Viktigste kolonner',
        fields: ['id', 'name', 'date', 'amount', 'status']
      },
      {
        id: 'detailed',
        label: 'Detaljert',
        description: 'Mer informasjon',
        fields: ['id', 'name', 'date', 'amount', 'status', 'description', 'category', 'created_at']
      },
      {
        id: 'complete',
        label: 'Komplett',
        description: 'All tilgjengelig data',
        fields: [] // Will be populated dynamically
      }
    ],
    defaultLevel: 'basic',
    autoAdvance: true
  },
  
  dashboard: {
    levels: [
      {
        id: 'overview',
        label: 'Oversikt',
        description: 'Viktigste KPI-er',
        fields: ['revenue', 'profit', 'costs', 'balance']
      },
      {
        id: 'analysis',
        label: 'Analyse',
        description: 'Detaljert analyse',
        fields: ['revenue', 'profit', 'costs', 'balance', 'ratios', 'trends', 'comparisons']
      },
      {
        id: 'comprehensive',
        label: 'Omfattende',
        description: 'Alle detaljer',
        fields: [] // All available fields
      }
    ],
    defaultLevel: 'overview',
    autoAdvance: false
  }
};