
import { Button } from "@/components/ui/button";
import ClientFilters from "@/components/Clients/ClientFilters/ClientFilters";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

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
  refreshProgress?: number;
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
  hasApiError,
  refreshProgress = 0
}: ClientsHeaderProps) => (
  <div className="flex flex-col gap-4 mb-6">
    <div className="flex justify-between items-center">
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
    
    {isRefreshing && (
      <div className="w-full">
        <div className="flex justify-between mb-1 text-sm">
          <span>Oppdaterer klienter fra Brønnøysund...</span>
          <span>{refreshProgress}%</span>
        </div>
        <Progress value={refreshProgress} className="w-full" />
      </div>
    )}
  </div>
);

export default ClientsHeader;
