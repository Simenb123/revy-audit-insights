
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klient</TableHead>
            <TableHead>Fase</TableHead>
            <TableHead>Progresjon</TableHead>
            <TableHead>Org.nummer</TableHead>
            <TableHead>Avdeling</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                Ingen klienter funnet
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow 
                key={client.id} 
                onClick={() => onRowSelect?.(client)}
                className={`cursor-pointer hover:bg-muted/50 ${selectedClientId === client.id ? 'bg-muted' : ''}`}
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={statusMap[client.phase].variant as any}
                  >
                    {statusMap[client.phase].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${client.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{client.progress}%</span>
                </TableCell>
                <TableCell>{client.orgNumber}</TableCell>
                <TableCell>{client.department}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientsTable;
