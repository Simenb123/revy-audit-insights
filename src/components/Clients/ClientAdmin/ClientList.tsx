
import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const navigateToClientDetails = (client: Client) => {
    navigate(`/klienter/${client.orgNumber}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Klientliste</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firmanavn</TableHead>
              <TableHead>Selskapsnavn</TableHead>
              <TableHead>Org.nr</TableHead>
              <TableHead>Kontaktperson</TableHead>
              <TableHead>Daglig leder</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Ingen klienter registrert
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow 
                  key={client.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigateToClientDetails(client)}
                >
                  <TableCell className="font-medium">{client.companyName}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.orgNumber}</TableCell>
                  <TableCell>{client.contactPerson || '-'}</TableCell>
                  <TableCell>{client.ceo || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToClientDetails(client);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(client);
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Er du sikker på at du vil slette ${client.companyName}?`)) {
                            onDelete(client.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClientList;
