
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/revio";
import { formatUpdateData, isDifferent } from "./formatBrregData";
import { updateClientRoles } from "./updateClientRoles";

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
          console.log(`Fetching data for ${client.name} (${client.orgNumber})`);
          const response = await fetch(`https://fxelhfwaoizqyecikscu.functions.supabase.co/brreg`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({ query: client.orgNumber }),
          });

          if (response.status === 404 || response.status === 429) {
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
          console.log(`Received data for ${client.name}:`, data);
          
          if (!data.basis || !data.basis.organisasjonsnummer) {
            failedClients.push(client.name);
            continue;
          }

          const basis = data.basis;
          const roles = data.roles;

          console.log(`Roles for ${client.name}:`, roles);
          
          const updateData = formatUpdateData(basis, roles, client);
          console.log(`Update data for ${client.name}:`, updateData);

          if (!isDifferent(updateData, client)) {
            console.log(`No changes for ${client.name}`);
            continue;
          }

          anyUpdate = true;
          console.log(`Updating ${client.name} in database`);

          const { error: updateError, data: updatedData } = await supabase
            .from("clients")
            .update(updateData)
            .eq("id", client.id)
            .select();

          if (updateError) {
            console.error(`Error updating ${client.name}:`, updateError);
            failedClients.push(client.name);
            continue;
          }

          if (roles && (roles.ceo || roles.chair || (roles.boardMembers && roles.boardMembers.length > 0))) {
            console.log(`Updating roles for ${client.name}`);
            await updateClientRoles(client.id, roles, client.name);
          }

          successCount++;
          if (updatedData && updatedData.length > 0) {
            updatedClientsData[client.id] = updateData;
          }
        } catch (error) {
          console.error(`Error processing ${client.name}:`, error);
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
          variant: "success" as any,
        });
      } else if (successCount === 0 && !anyUpdate) {
        toast({
          title: "Ingen endringer",
          description: "Alle klientdata var allerede oppdatert.",
          variant: "warning" as any,
        });
      } else if (successCount > 0) {
        toast({
          title: "Oppdatering fullført",
          description: `${successCount} klient(er) oppdatert.`,
          variant: "success" as any,
        });
      } else {
        toast({
          title: "Feil ved oppdatering",
          description: "Kunne ikke oppdatere noen klienter. Sjekk at org.nr er korrekt og at API-tilgangen er konfigurert.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("General error during refresh:", error);
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
