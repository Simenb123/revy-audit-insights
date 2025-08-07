
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/types/revio";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import EquityBadge from "./EquityBadge";
import TestDataBadge from "./TestDataBadge";

interface ClientsTableProps {
  clients: Client[];
  onRowSelect?: (client: Client) => void;
  selectedClientId?: string | null;
}

type SortField = 'name' | 'phase' | 'progress';
type SortDirection = 'asc' | 'desc';

const ClientsTable = ({ clients, onRowSelect, selectedClientId }: ClientsTableProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const statusMap = {
    engagement: { label: "Oppdrag", variant: "outline" },
    planning: { label: "Planlegging", variant: "secondary" },
    execution: { label: "Gjennomføring", variant: "default" },
    completion: { label: "Avslutning", variant: "success" },
    risk_assessment: { label: "Risikovurdering", variant: "warning" },
    reporting: { label: "Rapportering", variant: "default" },
    overview: { label: "Oversikt", variant: "secondary" }
  } as const;

  const getMunicipality = (client: Client) =>
    client.municipality_name?.trim()?.length
      ? client.municipality_name
      : client.municipality_code?.trim()?.length
        ? client.municipality_code
        : "—";

  const handleRowClick = (client: Client) => {
    onRowSelect?.(client);
    navigate(`/clients/${client.id}`);
  };

  const getStatusInfo = (phase: Client['phase']) => {
    return statusMap[phase] || { label: phase, variant: "outline" };
  };

  const phaseOrder = {
    engagement: 1,
    planning: 2,
    execution: 3,
    completion: 4,
    risk_assessment: 5,
    reporting: 6,
    overview: 7
  } as const;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedClients = useMemo(() => {
    if (!sortField) return clients;

    return [...clients].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name?.trim() || '';
          bValue = b.name?.trim() || '';
          break;
        case 'phase':
          aValue = phaseOrder[a.phase] || 999;
          bValue = phaseOrder[b.phase] || 999;
          break;
        case 'progress':
          aValue = a.progress ?? 0;
          bValue = b.progress ?? 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clients, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-2 h-4 w-4" />
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className={cn("cursor-pointer hover:bg-muted/50 select-none", sortField === 'name' && "bg-muted/50")}
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Klient
                {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead 
              className={cn("cursor-pointer hover:bg-muted/50 select-none", sortField === 'phase' && "bg-muted/50")}
              onClick={() => handleSort('phase')}
            >
              <div className="flex items-center">
                Fase
                {getSortIcon('phase')}
              </div>
            </TableHead>
            <TableHead 
              className={cn("cursor-pointer hover:bg-muted/50 select-none", sortField === 'progress' && "bg-muted/50")}
              onClick={() => handleSort('progress')}
            >
              <div className="flex items-center">
                Progresjon
                {getSortIcon('progress')}
              </div>
            </TableHead>
            <TableHead>Org.nummer</TableHead>
            <TableHead>Kommune</TableHead>
            <TableHead>Kapital</TableHead>
            <TableHead>Avdeling</TableHead>
            <TableHead>Gruppe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedClients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground h-32">
                Ingen klienter funnet
              </TableCell>
            </TableRow>
          ) : (
            sortedClients.map((client) => {
              const statusInfo = getStatusInfo(client.phase);
              return (
                <TableRow
                  key={client.id}
                  onClick={() => handleRowClick(client)}
                  className={`cursor-pointer hover:bg-muted/50 ${selectedClientId === client.id ? "bg-muted" : ""}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{(client.name && client.name.trim()) ? client.name : "—"}</span>
                      <TestDataBadge isTestData={client.is_test_data} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant as any}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${client.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{client.progress ?? 0}%</span>
                  </TableCell>
                  <TableCell>{(client.org_number && client.org_number.trim()) ? client.org_number : "—"}</TableCell>
                  <TableCell>
                    {client.municipality_name?.trim() 
                      ? client.municipality_name
                      : client.municipality_code?.trim()
                        ? client.municipality_code 
                        : "—"}
                  </TableCell>
                  <TableCell>
                    <EquityBadge equityCapital={client.equity_capital} shareCapital={client.share_capital} />
                  </TableCell>
                  <TableCell>{client.department?.trim() || "—"}</TableCell>
                  <TableCell>{client.client_group?.trim() || "—"}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientsTable;
