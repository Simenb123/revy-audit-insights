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
import { useState } from "react";

function EquityBadge({ equityCapital, shareCapital }: { equityCapital?: number; shareCapital?: number }) {
  const [showInfo, setShowInfo] = useState(false);

  if (!equityCapital || equityCapital <= 0) return null;

  const format = (n?: number) =>
    n != null
      ? new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n)
      : "—";

  return (
    <span
      className="ml-1"
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}
      tabIndex={0}
      onFocus={() => setShowInfo(true)}
      onBlur={() => setShowInfo(false)}
      style={{ position: "relative", display: "inline-block" }}
      aria-label="kapital-informasjon"
    >
      <Badge variant="secondary" className="cursor-help p-1 px-2" title="Se kapital">
        ₿
      </Badge>
      {showInfo && (
        <div className="absolute z-20 left-1/2 transform -translate-x-1/2 mt-2 bg-white text-sm border rounded shadow p-2 min-w-[120px] dark:bg-gray-900 dark:text-white">
          <div>
            <span className="font-medium">Egenkapital:</span>{" "}
            <span>{format(equityCapital)}</span>
          </div>
          <div>
            <span className="font-medium">Innskuddskapital:</span>{" "}
            <span>{format(shareCapital)}</span>
          </div>
        </div>
      )}
    </span>
  );
}

interface ClientsTableProps {
  clients: Client[];
  onRowSelect?: (client: Client) => void;
  selectedClientId?: string | null;
}

const ClientsTable = ({ clients, onRowSelect, selectedClientId }: ClientsTableProps) => {
  const statusMap = {
    engagement: { label: "Oppdrag", variant: "outline" },
    planning: { label: "Planlegging", variant: "secondary" },
    execution: { label: "Gjennomføring", variant: "default" },
    conclusion: { label: "Avslutning", variant: "success" },
  };

  const getMunicipality = (client: Client) =>
    client.municipalityName?.trim()?.length
      ? client.municipalityName
      : client.municipalityCode?.trim()?.length
        ? client.municipalityCode
        : "—";

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klient</TableHead>
            <TableHead>Fase</TableHead>
            <TableHead>Progresjon</TableHead>
            <TableHead>Org.nummer</TableHead>
            <TableHead>Kommune</TableHead>
            <TableHead>Avdeling</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                Ingen klienter funnet
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow
                key={client.id}
                onClick={() => onRowSelect?.(client)}
                className={`cursor-pointer hover:bg-muted/50 ${selectedClientId === client.id ? "bg-muted" : ""}`}
              >
                <TableCell className="font-medium">
                  {(client.name && client.name.trim()) ? client.name : "—"}
                  <EquityBadge equityCapital={client.equityCapital} shareCapital={client.shareCapital} />
                </TableCell>
                <TableCell>
                  <Badge variant={statusMap[client.phase]?.variant as any}>
                    {statusMap[client.phase]?.label}
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
                <TableCell>{(client.orgNumber && client.orgNumber.trim()) ? client.orgNumber : "—"}</TableCell>
                <TableCell>{getMunicipality(client)}</TableCell>
                <TableCell>{client.department?.trim() || "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientsTable;
