
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
    <header className="mb-6">
      <nav className="text-sm text-muted-foreground">
        <Button variant="ghost" className="p-0 h-auto font-normal" onClick={() => navigate('/klienter')}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Mine klienter
        </Button>
      </nav>
      
      <div className="mt-2">
        <h1 className="text-2xl font-semibold leading-none mb-2">
          {client.companyName}
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Org.nr: {client.orgNumber}</p>
          <Badge variant={client.status === 'Aktiv' ? 'success' : 'destructive'}>
            {client.status || 'Ukjent'}
          </Badge>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;
