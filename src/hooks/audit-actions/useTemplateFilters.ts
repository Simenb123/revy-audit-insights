import { useState, useMemo } from 'react';
import type { AuditPhase } from '@/types/revio';

interface TemplateBase {
  subject_area: string;
  risk_level: string;
  applicable_phases: AuditPhase[] | string[];
  name: string;
  procedures: string;
  description?: string;
  ai_metadata?: unknown;
}

interface Options {
  /** Pre-filter by subject area */
  selectedArea?: string;
  /** Include AI filter options */
  includeAI?: boolean;
  /** Initial phase filter value */
  initialPhase?: string;
}

/**
 * Hook for filtering audit action templates.
 * Provides search, risk level, phase, and AI filtering capabilities.
 * 
 * @example
 * ```tsx
 * const {
 *   searchTerm,
 *   setSearchTerm,
 *   riskFilter,
 *   setRiskFilter,
 *   filteredTemplates
 * } = useTemplateFilters(templates, { selectedArea: 'revenue' });
 * ```
 * 
 * @param templates - Array of templates to filter
 * @param options - Filter options
 * @returns Filter state and filtered templates
 */
export function useTemplateFilters<T extends TemplateBase>(templates: T[], options: Options = {}) {
  const { selectedArea, includeAI } = options;
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>(options.initialPhase ?? 'all');
  const [aiFilter, setAiFilter] = useState<string>('all');

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesArea = !selectedArea || template.subject_area === selectedArea;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        template.name.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term) ||
        template.procedures.toLowerCase().includes(term);
      const matchesRisk = riskFilter === 'all' || template.risk_level === riskFilter;
      const matchesPhase = phaseFilter === 'all' || (template.applicable_phases as string[]).includes(phaseFilter);
      const matchesAI = !includeAI || aiFilter === 'all' ||
        (aiFilter === 'with_ai' && template.ai_metadata) ||
        (aiFilter === 'without_ai' && !template.ai_metadata);
      return matchesArea && matchesSearch && matchesRisk && matchesPhase && matchesAI;
    });
  }, [templates, selectedArea, searchTerm, riskFilter, phaseFilter, aiFilter, includeAI]);

  return {
    searchTerm,
    setSearchTerm,
    riskFilter,
    setRiskFilter,
    phaseFilter,
    setPhaseFilter,
    aiFilter,
    setAiFilter,
    filteredTemplates
  };
}
