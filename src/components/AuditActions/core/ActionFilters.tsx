import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter } from 'lucide-react';
import { RiskLevel, ActionStatus, AuditSubjectArea } from '@/types/audit-actions';
import { PHASE_CONFIG } from '@/constants/auditPhases';
import { useSubjectAreaLabels } from '@/hooks/audit-actions/useSubjectAreaLabels';
import type { AuditPhase } from '@/types/revio';

export interface FilterConfig {
  search?: string;
  risk?: RiskLevel | 'all';
  phase?: AuditPhase | 'all';
  status?: ActionStatus | 'all';
  aiEnabled?: 'all' | 'with_ai' | 'without_ai';
  subjectArea?: AuditSubjectArea | 'all';
}

interface ActionFiltersProps {
  filters: FilterConfig;
  onChange: (filters: FilterConfig) => void;
  showSelectAll?: boolean;
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
  resultCount?: number;
  totalCount?: number;
  enabledFilters?: {
    search?: boolean;
    risk?: boolean;
    phase?: boolean;
    status?: boolean;
    ai?: boolean;
    subjectArea?: boolean;
  };
}

const ActionFilters = ({
  filters,
  onChange,
  showSelectAll = false,
  allSelected = false,
  onToggleSelectAll,
  resultCount,
  totalCount,
  enabledFilters = {
    search: true,
    risk: true,
    phase: true,
    status: false,
    ai: false,
    subjectArea: false,
  },
}: ActionFiltersProps) => {
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value });
  };

  const handleRiskChange = (value: string) => {
    onChange({ ...filters, risk: value as RiskLevel | 'all' });
  };

  const handlePhaseChange = (value: string) => {
    onChange({ ...filters, phase: value as AuditPhase | 'all' });
  };

  const handleStatusChange = (value: string) => {
    onChange({ ...filters, status: value as ActionStatus | 'all' });
  };

  const handleAIChange = (value: string) => {
    onChange({ ...filters, aiEnabled: value as 'all' | 'with_ai' | 'without_ai' });
  };

  const handleSubjectAreaChange = (value: string) => {
    onChange({ ...filters, subjectArea: value as AuditSubjectArea | 'all' });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Search */}
        {enabledFilters.search && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Søk..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Risk filter */}
        {enabledFilters.risk && (
          <div>
            <Label htmlFor="risk-filter" className="sr-only">Risikonivå</Label>
            <Select value={filters.risk || 'all'} onValueChange={handleRiskChange}>
              <SelectTrigger id="risk-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Risikonivå" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle risikonivå</SelectItem>
                <SelectItem value="critical">Kritisk risiko</SelectItem>
                <SelectItem value="high">Høy risiko</SelectItem>
                <SelectItem value="medium">Medium risiko</SelectItem>
                <SelectItem value="low">Lav risiko</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Phase filter */}
        {enabledFilters.phase && (
          <div>
            <Label htmlFor="phase-filter" className="sr-only">Fase</Label>
            <Select value={filters.phase || 'all'} onValueChange={handlePhaseChange}>
              <SelectTrigger id="phase-filter">
                <SelectValue placeholder="Fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle faser</SelectItem>
                {Object.entries(PHASE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status filter */}
        {enabledFilters.status && (
          <div>
            <Label htmlFor="status-filter" className="sr-only">Status</Label>
            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="not_started">Ikke startet</SelectItem>
                <SelectItem value="in_progress">Pågår</SelectItem>
                <SelectItem value="completed">Fullført</SelectItem>
                <SelectItem value="reviewed">Gjennomgått</SelectItem>
                <SelectItem value="approved">Godkjent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* AI filter */}
        {enabledFilters.ai && (
          <div>
            <Label htmlFor="ai-filter" className="sr-only">AI-status</Label>
            <Select value={filters.aiEnabled || 'all'} onValueChange={handleAIChange}>
              <SelectTrigger id="ai-filter">
                <SelectValue placeholder="AI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="with_ai">Med AI</SelectItem>
                <SelectItem value="without_ai">Uten AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Bottom row: Select all and count */}
      <div className="flex items-center justify-between">
        {showSelectAll && onToggleSelectAll && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onToggleSelectAll}
              aria-label="Velg alle synlige"
            />
            <span className="text-sm text-muted-foreground">Velg synlige</span>
          </div>
        )}

        {resultCount !== undefined && totalCount !== undefined && (
          <div className="text-sm text-muted-foreground ml-auto">
            {resultCount} av {totalCount} elementer
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionFilters;
