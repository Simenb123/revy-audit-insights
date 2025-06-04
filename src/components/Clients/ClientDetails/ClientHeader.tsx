
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin, Globe, Phone, Mail } from "lucide-react";

interface ClientHeaderProps {
  client: {
    companyName: string;
    orgNumber: string;
    status: string;
    industry?: string;
    city?: string;
    registrationDate?: string;
    phone?: string;
    email?: string;
    homepage?: string;
  };
}

const ClientHeader = ({ client }: ClientHeaderProps) => {
  const getStatusVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'AKTIV':
        return 'success';
      case 'INACTIVE':
      case 'INAKTIV':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'Aktiv';
      case 'INACTIVE':
        return 'Inaktiv';
      default:
        return status || 'Ukjent';
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Compact header with org number and status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg text-gray-600">
                <span className="font-medium">Org.nr:</span>
                <span className="font-mono bg-gray-100 px-3 py-1 rounded-md">{client.orgNumber}</span>
              </div>
            </div>
            <Badge 
              variant={getStatusVariant(client.status)}
              className="text-sm font-semibold px-3 py-1 shadow-sm"
            >
              {getStatusText(client.status)}
            </Badge>
          </div>

          {/* Client information grid - more compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Company Info */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Selskapsinfo
              </h3>
              <div className="space-y-2 text-sm">
                {client.industry && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="w-16 text-gray-500">Bransje:</span>
                    <span className="font-medium">{client.industry}</span>
                  </div>
                )}
                {client.registrationDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="w-16 text-gray-500">Reg.dato:</span>
                    <span>{client.registrationDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Info */}
            {client.city && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Lokasjon
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{client.city}</span>
                </div>
              </div>
            )}

            {/* Contact Info */}
            {(client.phone || client.email || client.homepage) && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  Kontakt
                </h3>
                <div className="space-y-2 text-sm">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                        {client.phone}
                      </a>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline truncate">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.homepage && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a 
                        href={client.homepage?.startsWith("http") ? client.homepage : `https://${client.homepage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {client.homepage}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientHeader;
