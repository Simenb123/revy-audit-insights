
import { Button } from "@/components/ui/button";
import ClientFilters from "@/components/Clients/ClientFilters/ClientFilters";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface ClientsHeaderProps {
  title: string;
  subtitle: string;
  searchTerm: string;
  onSearchChange: (s: string) => void;
  departmentFilter: string;
  onDepartmentChange: (s: string) => void;
  departments: string[];
  onRefresh: () => void;
  isRefreshing: boolean;
  hasApiError: boolean;
}

const ClientsHeader = ({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  departments,
  onRefresh,
  isRefreshing,
  hasApiError
}: ClientsHeaderProps) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
    </div>
    <div className="flex gap-4 items-center">
      <Button 
        variant={hasApiError ? "destructive" : "outline"}
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="gap-2"
      >
        {hasApiError ? (
          <AlertTriangle className="mr-1" size={16} />
        ) : (
          <RefreshCw className={isRefreshing ? "animate-spin mr-1" : "mr-1"} size={16} />
        )}
        {isRefreshing 
          ? "Oppdaterer..." 
          : hasApiError 
            ? "API-tilgangsfeil" 
            : "Oppdater fra Brønnøysund"}
      </Button>
      <ClientFilters 
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        departmentFilter={departmentFilter}
        onDepartmentChange={onDepartmentChange}
        departments={departments}
      />
    </div>
  </div>
);

export default ClientsHeader;
