
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, AlertTriangle, UserPlus, Database } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import TestDataFilter from './TestDataFilter';
import { BulkDiscoveryDialog } from '../BulkDiscoveryDialog';

interface ClientsHeaderProps {
  title: string;
  subtitle: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  departments: string[];
  onRefresh: () => void;
  isRefreshing: boolean;
  hasApiError: boolean;
  refreshProgress: number;
  showTestData?: boolean;
  onTestDataToggle?: (show: boolean) => void;
  onAddClient?: () => void;
}

const ClientsHeader: React.FC<ClientsHeaderProps> = ({
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
  refreshProgress,
  showTestData = true,
  onTestDataToggle,
  onAddClient
}) => {
  return (
    <header className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {onTestDataToggle && (
            <TestDataFilter 
              showTestData={showTestData} 
              onToggle={onTestDataToggle} 
            />
          )}
          
          <BulkDiscoveryDialog>
            <Button variant="outline" className="flex items-center gap-2">
              <Database size={16} />
              Bulk discovery
            </Button>
          </BulkDiscoveryDialog>
          
          {onAddClient && (
            <Button onClick={onAddClient} className="flex items-center gap-2">
              <UserPlus size={16} />
              Ny klient
            </Button>
          )}
          
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant={hasApiError ? "destructive" : "outline"}
            className="flex items-center gap-2"
          >
            {hasApiError ? (
              <AlertTriangle size={16} />
            ) : (
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            )}
            {hasApiError ? "API-feil" : isRefreshing ? "Oppdaterer..." : "Oppdater fra Brønnøysund"}
          </Button>
        </div>
      </div>

      {isRefreshing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Oppdaterer klientdata...</span>
            <span>{refreshProgress}%</span>
          </div>
          <Progress value={refreshProgress} className="w-full" />
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Søk etter klient, selskap eller org.nr..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={departmentFilter} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle avdelinger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle avdelinger</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
};

export default ClientsHeader;
