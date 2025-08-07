
import { Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  departments: string[];
  groupFilter: string;
  onGroupChange: (value: string) => void;
  groups: string[];
}

const ClientFilters = ({ 
  searchTerm, 
  onSearchChange, 
  departmentFilter, 
  onDepartmentChange,
  departments,
  groupFilter,
  onGroupChange,
  groups
}: ClientFiltersProps) => {
  return (
    <div className="flex gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          className="pl-10 w-64" 
          placeholder="Søk på klient eller org. nr."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <Select value={departmentFilter} onValueChange={onDepartmentChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Velg avdeling" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle avdelinger</SelectItem>
          {departments.map(dept => (
            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={groupFilter} onValueChange={onGroupChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Velg gruppe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle grupper</SelectItem>
          {groups.map(group => (
            <SelectItem key={group} value={group}>{group}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button className="gap-2 bg-revio-500 hover:bg-revio-600">
        <Filter size={18} />
        <span>Flere filtre</span>
      </Button>
    </div>
  );
};

export default ClientFilters;
