import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client, ClientRole } from '@/types/revio';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDate } from '@/lib/formatters';
import BoardAccordion from './BoardAccordion';

interface ClientDetailsProps {
  client: Client | null;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client }) => {
  if (!client) return null;

  const formatCurrency = (value?: number) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const boardMemberCount = (client.roles || []).filter(role => role.roleType === 'MEMBER' || role.roleType === 'SIGNATORY').length;

  const getRolesByType = (type: string) => 
    (client.roles || []).filter(role => role.roleType === type);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Selskapsdetaljer</span>
          {client.status && (
            <Badge variant="outline" className="text-xs">
              Status: {client.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2">Basisdata</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Org.nummer:</span>
                <span className="font-mono">{client.orgNumber}</span>
              </div>
              {client.orgFormCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organisasjonsform:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="cursor-help">
                          {client.orgFormCode}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {client.orgFormDescription || client.orgFormCode}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              {client.naceCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Næringskode:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="cursor-help">
                          {client.naceCode}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {client.naceDescription || client.industry || client.naceCode}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              {client.registrationDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registreringsdato:</span>
                  <span>{formatDate(client.registrationDate)}</span>
                </div>
              )}
              {client.municipalityName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kommune:</span>
                  <Badge variant="secondary">{client.municipalityName}</Badge>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Kontakt og roller</h3>
            <div className="space-y-2 text-sm">
              {client.address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adresse:</span>
                  <span className="text-right">{client.address}</span>
                </div>
              )}
              {(client.postalCode || client.city) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poststed:</span>
                  <span>{`${client.postalCode || ''} ${client.city || ''}`}</span>
                </div>
              )}
              {client.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-post:</span>
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon:</span>
                  <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.homepage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nettside:</span>
                  <a
                    href={client.homepage.startsWith('http') ? client.homepage : `https://${client.homepage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-[180px]"
                  >
                    {client.homepage}
                  </a>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Økonomi og ledelse</h3>
            <div className="space-y-2 text-sm">
              {client.shareCapital != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Innskuddskapital:</span>
                  <span>{formatCurrency(client.shareCapital)}</span>
                </div>
              )}
              {client.equityCapital != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aksjekapital:</span>
                  <span>{formatCurrency(client.equityCapital)}</span>
                </div>
              )}
              {client.ceo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daglig leder:</span>
                  <span>{client.ceo}</span>
                </div>
              )}
              {client.chair && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Styreleder:</span>
                  <span>{client.chair}</span>
                </div>
              )}
              {boardMemberCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Styremedlemmer:</span>
                  <Badge>{boardMemberCount}</Badge>
                </div>
              )}
            </div>
          </div>
        </div>
        {(client.roles?.length ?? 0) > 0 && <div className="mt-4"><BoardAccordion roles={client.roles || []} /></div>}
      </CardContent>
    </Card>
  );
};

export default ClientDetails;
