import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';

interface StatusOption { value: string; label: string }

interface ActionsFilterHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statusOptions: StatusOption[];
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
}

const ActionsFilterHeader: React.FC<ActionsFilterHeaderProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  allVisibleSelected,
  onToggleSelectAllVisible
}) => {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Søk i handlinger..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border rounded-md bg-background"
        aria-label="Filtrer på status"
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allVisibleSelected}
          onCheckedChange={onToggleSelectAllVisible}
          aria-label="Velg alle synlige"
        />
        <span className="text-sm text-muted-foreground">Velg synlige</span>
      </div>
    </div>
  );
};

export default ActionsFilterHeader;
