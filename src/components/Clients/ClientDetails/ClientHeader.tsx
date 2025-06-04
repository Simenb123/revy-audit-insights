
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin } from "lucide-react";

interface ClientHeaderProps {
  client: {
    companyName: string;
    orgNumber: string;
    status: string;
    industry?: string;
    city?: string;
    registrationDate?: string;
  };
}

const ClientHeader = ({ client }: ClientHeaderProps) => {
  return (
    <div className="space-y-4">
      {/* Main client title with floating status */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {client.companyName}
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            Org.nr: {client.orgNumber}
          </p>
        </div>
        <div className="ml-4">
          <Badge 
            variant={client.status === 'Aktiv' ? 'success' : 'destructive'}
            className="text-sm font-medium px-3 py-1"
          >
            {client.status || 'Ukjent'}
          </Badge>
        </div>
      </div>

      {/* Additional client information */}
      <div className="flex flex-wrap gap-6 text-sm text-gray-600">
        {client.industry && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>{client.industry}</span>
          </div>
        )}
        {client.city && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{client.city}</span>
          </div>
        )}
        {client.registrationDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Registrert: {client.registrationDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientHeader;
