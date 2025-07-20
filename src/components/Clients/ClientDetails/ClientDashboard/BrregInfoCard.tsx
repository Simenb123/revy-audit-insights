import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Users, Calendar, Globe, MapPin } from "lucide-react";
import { Client } from "@/types/revio";
import { ClientRole } from "@/types/revio";

interface BrregInfoCardProps {
  client: Client;
  roles: ClientRole[];
}

const BrregInfoCard = ({ client, roles }: BrregInfoCardProps) => {
  const ceoRole = roles.find(role => role.role_type === 'CEO');
  const chairRole = roles.find(role => role.role_type === 'CHAIR');
  const boardMembers = roles.filter(role => role.role_type === 'BOARD_MEMBER');

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          BRREG Informasjon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Organisasjonsform</h4>
            <p className="text-sm">{client.org_form_description || 'Ikke tilgjengelig'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">NACE-kode</h4>
            <p className="text-sm">{client.nace_code || 'Ikke tilgjengelig'}</p>
            {client.nace_description && (
              <p className="text-xs text-muted-foreground mt-1">{client.nace_description}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Adresse
          </h4>
          <p className="text-sm">
            {client.address || 'Ikke tilgjengelig'}
          </p>
          {(client.postal_code || client.city) && (
            <p className="text-sm">
              {client.postal_code} {client.city}
            </p>
          )}
          {client.municipality_name && (
            <p className="text-xs text-muted-foreground mt-1">
              Kommune: {client.municipality_name}
            </p>
          )}
        </div>

        {/* Leadership */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <User className="h-4 w-4" />
            Ledelse
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-xs font-medium text-muted-foreground">Daglig leder</p>
              <p className="text-sm font-medium">{ceoRole?.name || client.ceo || 'Ikke registrert'}</p>
              {ceoRole?.from_date && (
                <p className="text-xs text-muted-foreground">Fra: {formatDate(ceoRole.from_date)}</p>
              )}
            </div>
            
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-xs font-medium text-muted-foreground">Styreleder</p>
              <p className="text-sm font-medium">{chairRole?.name || client.chair || 'Ikke registrert'}</p>
              {chairRole?.from_date && (
                <p className="text-xs text-muted-foreground">Fra: {formatDate(chairRole.from_date)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Board Members */}
        {boardMembers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Users className="h-4 w-4" />
              Styremedlemmer ({boardMembers.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {boardMembers.map((member, index) => (
                <div key={index} className="p-2 bg-muted/30 rounded-sm">
                  <p className="text-sm font-medium">{member.name}</p>
                  {member.from_date && (
                    <p className="text-xs text-muted-foreground">Fra: {formatDate(member.from_date)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Registrert: {client.registration_date ? formatDate(client.registration_date) : 'Ikke tilgjengelig'}
            </span>
          </div>
          
          {client.homepage && (
            <a 
              href={client.homepage} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Globe className="h-3 w-3" />
              Hjemmeside
            </a>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {client.status || 'Ukjent status'}
          </Badge>
          
          {client.share_capital && (
            <span className="text-xs text-muted-foreground">
              Aksjekapital: {client.share_capital.toLocaleString('nb-NO')} NOK
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BrregInfoCard;