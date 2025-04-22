
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/revio";
import { ChevronLeft } from "lucide-react";

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
      
      <div className="mt-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm">Org.nr: {client.orgNumber}</p>
            <Badge variant={client.status === 'Aktiv' ? 'success' : 'destructive'}>
              {client.status || 'Ukjent'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientHeader;
