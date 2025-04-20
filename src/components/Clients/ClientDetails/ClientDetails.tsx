
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client, ClientRole } from "@/types/revio";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import BoardAccordion from "./BoardAccordion";
import { formatDate } from "@/lib/formatters";
// Extra: Globe icon for homepage
import { Globe } from "lucide-react";

interface ClientDetailsProps {
  client: Client | null;
}

// Helper to formater tallet som NOK
const formatCurrency = (value?: number) => {
  if (value == null) return null;
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper for phone formatting (adds space if 8 digits, Norway style)
const formatPhone = (phone?: string | null): string => {
  if (!phone) return "—";
  if (phone.length === 8) return `${phone.slice(0, 3)} ${phone.slice(3, 5)} ${phone.slice(5)}`;
  return phone;
};

const ClientDetails: React.FC<ClientDetailsProps> = ({ client }) => {
  if (!client) return null;

  const isEmpty = (s?: string | null) => !(s && s.trim().length > 0);

  const statusVariant =
    client.status === "ACTIVE"
      ? "success"
      : client.status === "INACTIVE"
        ? "outline"
        : "secondary";

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Selskapsdetaljer</span>
          {!isEmpty(client.status) && (
            <Badge
              variant={statusVariant}
              className={`text-xs ${client.status === "ACTIVE"
                ? "bg-green-500 text-white"
                : client.status === "INACTIVE"
                  ? "bg-gray-300 text-gray-600"
                  : ""
                }`}
            >
              Status:{" "}
              {client.status === "ACTIVE"
                ? "Aktiv"
                : client.status === "INACTIVE"
                  ? "Inaktiv"
                  : client.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 1. Adresse & kommune */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2">Adresse & kommune</h3>
            <div className="space-y-2 text-sm">
              {!isEmpty(client.address) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adresse:</span>
                  <span className="text-right">{client.address}</span>
                </div>
              )}
              {(client.postalCode || client.city) && !(isEmpty(client.postalCode) && isEmpty(client.city)) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poststed:</span>
                  <span>
                    {client.postalCode?.trim() || ""}
                    {client.city?.trim() ? ` ${client.city}` : ""}
                  </span>
                </div>
              )}
              {(client.municipalityName || client.municipalityCode) && !isEmpty(client.municipalityName) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kommune:</span>
                  <span>
                    {client.municipalityName}
                    {client.municipalityCode ? (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({client.municipalityCode})
                      </span>
                    ) : null}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Kontakt og roller */}
          <div>
            <h3 className="font-medium mb-2">Kontaktinfo</h3>
            <div className="space-y-2 text-sm">
              {!isEmpty(client.email) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-post:</span>
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">{client.email}</a>
                </div>
              )}
              {!isEmpty(client.phone) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon:</span>
                  <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">{formatPhone(client.phone)}</a>
                </div>
              )}
              {!isEmpty(client.homepage) && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nettside:</span>
                  <a
                    href={client.homepage?.startsWith("http") ? client.homepage : `https://${client.homepage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-[140px] flex items-center gap-1"
                  >
                    <Globe size={16} className="inline mr-1" />
                    <span className="truncate">{client.homepage}</span>
                  </a>
                </div>
              )}
            </div>
            {/* Roller (kun for oversikt, detaljert i accordion) */}
            <div className="space-y-2 text-sm mt-4">
              {!isEmpty(client.ceo) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daglig leder:</span>
                  <span>{client.ceo}</span>
                </div>
              )}
              {!isEmpty(client.chair) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Styreleder:</span>
                  <span>{client.chair}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Kapital & status */}
          <div>
            <h3 className="font-medium mb-2">Kapital & status</h3>
            <div className="space-y-2 text-sm">
              {client.equityCapital != null && client.equityCapital > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Egenkapital:</span>
                  <span>{formatCurrency(client.equityCapital)}</span>
                </div>
              )}
              {client.shareCapital != null && client.shareCapital > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Innskuddskapital:</span>
                  <span>{formatCurrency(client.shareCapital)}</span>
                </div>
              )}
              {isEmpty(client.equityCapital?.toString()) && isEmpty(client.shareCapital?.toString()) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kapital:</span>
                  <span>—</span>
                </div>
              )}
              {client.status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant={statusVariant}
                    className={client.status === "ACTIVE"
                      ? "bg-green-500 text-white"
                      : client.status === "INACTIVE"
                        ? "bg-gray-300 text-gray-600"
                        : ""}
                  >
                    {client.status === "ACTIVE"
                      ? "Aktiv"
                      : client.status === "INACTIVE"
                        ? "Inaktiv"
                        : client.status}
                  </Badge>
                </div>
              )}
              {/* Registreringsdato */}
              {client.registrationDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registreringsdato:</span>
                  <span>{formatDate(client.registrationDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {(client.roles?.length ?? 0) > 0 && (
          <div className="mt-4">
            <BoardAccordion roles={client.roles || []} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientDetails;
