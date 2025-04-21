
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/revio";

interface ClientHeaderProps {
  client: Client;
}

const ClientHeader = ({ client }: ClientHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <Button variant="outline" onClick={() => navigate('/klienter')}>
        <ChevronLeft className="mr-2 h-4 w-4" /> Tilbake
      </Button>
      
      <div className="mt-4">
        <h1 className="text-3xl font-bold">{client.companyName}</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-muted-foreground">Org.nr: {client.orgNumber}</p>
          <Badge variant={client.status === 'Aktiv' ? 'success' : 'destructive'}>
            {client.status || 'Ukjent'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ClientHeader;
