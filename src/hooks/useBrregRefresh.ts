
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientRole } from "@/types/revio";

interface UseBrregRefreshOptions {
  clients: Client[];
}

export function useBrregRefresh({ clients }: UseBrregRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasApiError, setHasApiError] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const queryClient = useQueryClient();

  const handleRefreshBrregData = async () => {
    setIsRefreshing(true);
    setHasApiError(false);
    setRefreshProgress(0);

    let successCount = 0;
    let failedClients: string[] = [];
    let apiAuthError = false;
    let updatedClientsData: Record<string, any> = {};
    let anyUpdate = false;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const authHeader = session ? `Bearer ${session.access_token}` : undefined;

      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        setRefreshProgress(Math.round((i / clients.length) * 100));

        if (!client.orgNumber) {
          failedClients.push(client.name);
          continue;
        }

        try {
          const response = await fetch(`https://fxelhfwaoizqyecikscu.functions.supabase.co/brreg`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({ query: client.orgNumber }),
          });

          if (response.status === 404) {
            failedClients.push(client.name);
            continue;
          }
          if (response.status === 429) {
            failedClients.push(client.name);
            continue;
          }
          if (response.status === 502) {
            const errorData = await response.json();
            if (errorData?.error === "Authentication error with Brønnøysund API") {
              apiAuthError = true;
              failedClients.push(client.name);
              continue;
            }
          }
          if (!response.ok) {
            failedClients.push(client.name);
            continue;
          }

          const data = await response.json();
          if (!data.basis || !data.basis.organisasjonsnummer) {
            failedClients.push(client.name);
            continue;
          }

          const basis = data.basis;
          const roles = data.roles;

          const fixValue = (val: string | undefined | null) =>
            val && String(val).trim().length > 0 ? val : null;

          const addressLines = Array.isArray(basis.addressLines) ? basis.addressLines : [];
          const addressLine = addressLines.length > 0 ? addressLines.join(", ") : null;
          const email = fixValue(basis.email);
          const homepage = fixValue(basis.homepage);
          const phone = fixValue(basis.telefon);

          const equityCapital =
            typeof basis.kapital?.equityCapital === "number" ? basis.kapital.equityCapital : null;
          const shareCapital =
            typeof basis.kapital?.shareCapital === "number" ? basis.kapital.shareCapital : null;

          const municipalityCode = fixValue(basis.kommune?.kommunenummer);
          const municipalityName = fixValue(basis.kommune?.navn);
          const postalCode = fixValue(basis.postalCode);
          const city = fixValue(basis.city);

          const updateData: Record<string, any> = {
            name: fixValue(basis.navn) || client.name,
            company_name: fixValue(basis.navn) || client.companyName,
            org_form_code: fixValue(basis.organisasjonsform?.kode),
            org_form_description: fixValue(basis.organisasjonsform?.beskrivelse),
            homepage,
            status: fixValue(basis.status),
            nace_code: fixValue(basis.naeringskode1?.kode),
            nace_description: fixValue(basis.naeringskode1?.beskrivelse),
            industry: fixValue(basis.naeringskode1?.beskrivelse) || client.industry || null,
            municipality_code: municipalityCode,
            municipality_name: municipalityName,
            address: addressLine,
            address_line: addressLine,
            postal_code: postalCode,
            city,
            registration_date: basis.registreringsdatoEnhetsregisteret
              ? new Date(basis.registreringsdatoEnhetsregisteret).toISOString().split("T")[0]
              : client.registrationDate || null,
            email: email || client.email || null,
            phone: phone || client.phone || null,
            ceo: fixValue(roles?.ceo?.name) || client.ceo || null,
            chair: fixValue(roles?.chair?.name) || client.chair || null,
            equity_capital: equityCapital,
            share_capital: shareCapital,
          };

          const isDifferent = Object.keys(updateData).some((key) => {
            const currentVal = client[
              key
                .replace(/_([a-z])/g, (_, c) => c.toUpperCase())
                .replace("address_line", "address")
            ];
            if (
              (updateData[key] == null && (currentVal == null || currentVal === "")) ||
              updateData[key] === currentVal
            ) {
              return false;
            }
            return true;
          });

          if (!isDifferent) continue;

          anyUpdate = true;

          const { error: updateError, data: updatedData } = await supabase
            .from("clients")
            .update(updateData)
            .eq("id", client.id)
            .select();

          if (updateError) {
            failedClients.push(client.name);
            continue;
          }

          if (roles && (roles.ceo || roles.chair || (roles.boardMembers && roles.boardMembers.length > 0))) {
            try {
              await supabase.from("client_roles").delete().eq("client_id", client.id);
              const rolesToInsert = [];
              if (roles.ceo) {
                rolesToInsert.push({
                  client_id: client.id,
                  role_type: "CEO",
                  name: roles.ceo.name,
                  from_date: roles.ceo.fromDate || null,
                  to_date: roles.ceo.toDate || null,
                });
              }
              if (roles.chair) {
                rolesToInsert.push({
                  client_id: client.id,
                  role_type: "CHAIR",
                  name: roles.chair.name,
                  from_date: roles.chair.fromDate || null,
                  to_date: roles.chair.toDate || null,
                });
              }
              if (roles.boardMembers) {
                for (const member of roles.boardMembers) {
                  rolesToInsert.push({
                    client_id: client.id,
                    role_type: member.roleType || "MEMBER",
                    name: member.name,
                    from_date: member.fromDate || null,
                    to_date: member.toDate || null,
                  });
                }
              }
              if (rolesToInsert.length > 0) {
                await supabase.from("client_roles").insert(rolesToInsert);
              }
            } catch (rolesError) {
              console.error(`Error processing roles for ${client.name}:`, rolesError);
            }
          }

          successCount++;
          if (updatedData && updatedData.length > 0) {
            updatedClientsData[client.id] = updateData;
          }
        } catch (clientError) {
          failedClients.push(client.name);
        }
      }

      setRefreshProgress(100);
      if (apiAuthError) setHasApiError(true);
      await queryClient.invalidateQueries({ queryKey: ["clients"] });

      if (apiAuthError) {
        toast({
          title: "API-tilgangsfeil",
          description: "Kunne ikke koble til Brønnøysundregisteret. Sjekk at du har riktig API-nøkkel konfigurert.",
          variant: "destructive",
        });
      } else if (successCount > 0 && anyUpdate) {
        toast({
          title: "Oppdatering fullført",
          description: `Klientdata oppdatert i databasen (${successCount} oppdatert).`,
          variant: "default",
        });
      } else if (successCount === 0 && !anyUpdate) {
        toast({
          title: "Ingen endringer",
          description: "Alle klientdata var allerede oppdatert.",
          variant: "default",
        });
      } else if (successCount > 0) {
        toast({
          title: "Oppdatering fullført",
          description: `${successCount} klient(er) oppdatert.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Feil ved oppdatering",
          description: "Kunne ikke oppdatere noen klienter. Sjekk at org.nr er korrekt og at API-tilgangen er konfigurert.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke hente oppdatert data fra Brønnøysund. Vennligst prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
      setRefreshProgress(0);
    }
  };

  return { handleRefreshBrregData, isRefreshing, hasApiError, refreshProgress };
}
