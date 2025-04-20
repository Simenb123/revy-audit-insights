
import React from 'react';
import { Client } from '@/types/revio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Klientliste</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead>Org.nr</TableHead>
              <TableHead>Kontaktperson</TableHead>
              <TableHead>Daglig leder</TableHead>
              <TableHead>Styreleder</TableHead>
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
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.orgNumber}</TableCell>
                  <TableCell>{client.contactPerson || '-'}</TableCell>
                  <TableCell>{client.ceo || '-'}</TableCell>
                  <TableCell>{client.chair || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => onEdit(client)}>
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => {
                          if (confirm(`Er du sikker på at du vil slette ${client.name}?`)) {
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
