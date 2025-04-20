
import { Button } from "@/components/ui/button";
import ClientFilters from "@/components/Clients/ClientFilters/ClientFilters";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={hasApiError ? "destructive" : "outline"}
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              {hasApiError ? (
                <AlertTriangle className="mr-1" size={16} />
              ) : isRefreshing ? (
                <RefreshCw className="animate-spin mr-1" size={16} />
              ) : (
                <RefreshCw className="mr-1" size={16} />
              )}
              {isRefreshing 
                ? "Oppdaterer fra Brønnøysund..." 
                : hasApiError 
                  ? "API-tilgangsfeil" 
                  : "Oppdater fra Brønnøysund"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasApiError 
              ? "Det er problemer med tilkobling til Brønnøysundregistrenes API. Sjekk at du har riktig API-nøkkel konfigurert." 
              : "Hent oppdatert informasjon om klienter fra Brønnøysundregistrene og lagre i databasen"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
