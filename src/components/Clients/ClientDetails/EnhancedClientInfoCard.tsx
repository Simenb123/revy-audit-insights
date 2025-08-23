import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  User, 
  Users, 
  Calendar,
  Globe,
  MapPin,
  Phone,
  Mail,
  Calculator,
  FileText,
  Shield,
  TrendingUp
} from 'lucide-react';
import { Client } from '@/types/revio';
import { ClientRole } from '@/types/revio';
import { FinancialFrameworkType } from '@/types/client-extended';
import EditableClientField from './EditableClientField';
import { useClientTeamMembers } from '@/hooks/useClientTeamMembers';
import { getFinancialFrameworkDisplayText } from '@/hooks/useClientFieldUpdate';

// Extend Client type with new database fields for this component
interface ExtendedClientProps extends Client {
  financial_framework?: FinancialFrameworkType;
  is_part_of_group?: boolean;
  group_name?: string;
  financial_framework_override?: boolean;
}

interface EnhancedClientInfoCardProps {
  client: ExtendedClientProps;
  roles: ClientRole[];
}

const EnhancedClientInfoCard = ({ client, roles }: EnhancedClientInfoCardProps) => {
  const ceoRole = roles.find(role => role.role_type === 'CEO');
  const chairRole = roles.find(role => role.role_type === 'CHAIR');
  const { data: teamMembers = [], isLoading: teamLoading } = useClientTeamMembers(client.id);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  // Use database values or fallback to calculated/mock values
  const getFinancialFramework = () => {
    if (client.financial_framework) {
      return getFinancialFrameworkDisplayText(client.financial_framework);
    }
    // Fallback logic for clients without stored framework
    if (client.share_capital && client.share_capital > 23000000) {
      return 'NGAAP store foretak';
    } else if (client.share_capital && client.share_capital > 70000) {
      return 'NGAAP mellomstore foretak';
    }
    return 'NGAAP små foretak';
  };

  const mockData = {
    registeredAccountant: 'RegnskapsPartner AS',
    accountantContact: 'lisa.regnskapsforer@regnskapspartner.no',
    businessDescription: client.nace_description || 'Generell forretningsvirksomhet'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Klientinformasjon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Description */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Virksomhetsbeskrivelse
          </h4>
          <p className="text-sm">{mockData.businessDescription}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{client.org_form_description || 'AS'}</Badge>
            <Badge variant="outline">{client.nace_code}</Badge>
            {client.status === 'ACTIVE' && (
              <Badge variant="default">Aktiv</Badge>
            )}
          </div>
        </div>

        {/* Key Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Finansielt rammeverk</h4>
            <EditableClientField
              clientId={client.id}
              field="financial_framework"
              value={client.financial_framework}
              displayValue={getFinancialFramework()}
              type="select"
              className="text-sm font-medium"
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Selskap i konsern</h4>
            <EditableClientField
              clientId={client.id}
              field="is_part_of_group"
              value={client.is_part_of_group || false}
              type="boolean"
            />
          </div>
          {client.is_part_of_group && (
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Konsernnavn</h4>
              <EditableClientField
                clientId={client.id}
                field="group_name"
                value={client.group_name}
                type="text"
                placeholder="Skriv inn konsernnavn..."
                className="text-sm"
              />
            </div>
          )}
          {client.share_capital && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Aksjekapital</h4>
              <p className="text-sm font-medium">{client.share_capital.toLocaleString('nb-NO')} NOK</p>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Regnskapsår slutt</h4>
            <p className="text-sm font-medium">
              {client.year_end_date ? new Date(client.year_end_date).toLocaleDateString('nb-NO') : '31. desember'}
            </p>
          </div>
        </div>

        {/* Leadership with Contact Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <User className="h-4 w-4" />
            Ledelse og kontakt
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Daglig leder</p>
              <p className="text-sm font-medium">{ceoRole?.name || client.ceo || 'Ikke registrert'}</p>
              {ceoRole?.from_date && (
                <p className="text-xs text-muted-foreground">Siden: {formatDate(ceoRole.from_date)}</p>
              )}
              {/* Mock contact info */}
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span>daglig.leder@{client.company_name?.toLowerCase().replace(/\s/g, '')}.no</span>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Styreleder</p>
              <p className="text-sm font-medium">{chairRole?.name || client.chair || 'Ikke registrert'}</p>
              {chairRole?.from_date && (
                <p className="text-xs text-muted-foreground">Siden: {formatDate(chairRole.from_date)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Team and Contacts */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Users className="h-4 w-4" />
            Team og partnere
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Teammedlemmer</p>
              <div className="space-y-1 mt-1">
                {teamLoading ? (
                  <p className="text-sm text-muted-foreground">Laster...</p>
                ) : teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <p className="text-sm">
                        {member.profile?.firstName && member.profile?.lastName 
                          ? `${member.profile.firstName} ${member.profile.lastName}`
                          : member.profile?.email || 'Ukjent bruker'
                        }
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen teammedlemmer</p>
                )}
              </div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground">Regnskapsfører</p>
              <p className="text-sm font-medium">{mockData.registeredAccountant}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span>{mockData.accountantContact}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.accounting_system && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Calculator className="h-4 w-4" />
                Regnskapssystem
              </h4>
              <p className="text-sm font-medium">{client.accounting_system}</p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Registrert
            </h4>
            <p className="text-sm">{client.registration_date ? formatDate(client.registration_date) : 'Ikke tilgjengelig'}</p>
          </div>
        </div>

        {/* Address */}
        {client.address && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Adresse
            </h4>
            <div className="text-sm">
              <p>{client.address}</p>
              {(client.postal_code || client.city) && (
                <p>{client.postal_code} {client.city}</p>
              )}
              {client.municipality_name && (
                <p className="text-xs text-muted-foreground mt-1">
                  Kommune: {client.municipality_name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Website */}
        {client.homepage && (
          <div className="pt-2 border-t">
            <a 
              href={client.homepage} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Globe className="h-4 w-4" />
              Besøk hjemmeside
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedClientInfoCard;