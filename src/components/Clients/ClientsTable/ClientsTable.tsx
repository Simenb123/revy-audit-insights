import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Client } from "@/types/revio";
import { phaseLabels } from "@/utils/clientHelpers";

interface ClientsTableProps {
  clients: Client[];
}

const ClientsTable = ({ clients }: ClientsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Klient</TableHead>
          <TableHead>Org. nr.</TableHead>
          <TableHead>Fase</TableHead>
          <TableHead>Fremdrift</TableHead>
          <TableHead>Skjemastatus</TableHead>
          <TableHead>Risiko</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map(client => (
          <TableRow key={client.id} className="cursor-pointer hover:bg-muted/80">
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.orgNumber}</TableCell>
            <TableCell>
              <Badge variant={client.phase === 'conclusion' ? 'success' : 
                                    client.phase === 'execution' ? 'warning' : 
                                    'outline'}>
                {phaseLabels[client.phase]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="w-full max-w-24">
                <div className="flex justify-between text-xs mb-1">
                  <span>{client.progress}%</span>
                </div>
                <Progress value={client.progress} className="h-2" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-1">
                {client.documents.map((doc, idx) => {
                  let color;
                  switch(doc.status) {
                    case 'accepted': color = 'bg-green-500'; break;
                    case 'submitted': color = 'bg-yellow-500'; break;
                    case 'pending': color = 'bg-gray-300'; break;
                  }
                  return (
                    <div key={idx} className={`w-3 h-3 rounded-full ${color}`} title={
                      doc.type === 'shareholder_report' ? 'Aksjonærregisteroppgave' :
                      doc.type === 'tax_return' ? 'Skattemelding' : 'Årsregnskap'
                    }></div>
                  );
                })}
              </div>
            </TableCell>
            <TableCell>
              {client.riskAreas.some(area => area.risk === 'high') && (
                <Badge variant="destructive">Høy risiko</Badge>
              )}
              {!client.riskAreas.some(area => area.risk === 'high') && 
               client.riskAreas.some(area => area.risk === 'medium') && (
                <Badge variant="warning">Medium risiko</Badge>
              )}
              {client.riskAreas.every(area => area.risk === 'low') && (
                <Badge variant="outline">Lav risiko</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ClientsTable;
