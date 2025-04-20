
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseBrregRefreshOptions {
  clients: any[];
}

export function useBrregRefresh({ clients }: UseBrregRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasApiError, setHasApiError] = useState(false);
  const queryClient = useQueryClient();

  const handleRefreshBrregData = async () => {
    setIsRefreshing(true);
    setHasApiError(false);

    let successCount = 0;
    let failedClients: string[] = [];
    let apiAuthError = false;

    try {
      // Get the current session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      
      // Prepare authorization header if we have a session
      const authHeader = session ? `Bearer ${session.access_token}` : undefined;
      
      for (const client of clients) {
        if (!client.orgNumber) {
          failedClients.push(client.name);
          console.error(`Missing organization number for client: ${client.name}`);
          continue;
        }

        try {
          const response = await fetch(`https://fxelhfwaoizqyecikscu.functions.supabase.co/brreg`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(authHeader ? { 'Authorization': authHeader } : {})
            },
            body: JSON.stringify({ query: client.orgNumber }),
          });

          if (response.status === 502) {
            const errorData = await response.json();
            if (errorData?.error === 'Authentication error with Brønnøysund API') {
              console.error(`Authentication error with Brønnøysund API: ${errorData.message}`);
              apiAuthError = true;
              failedClients.push(client.name);
              continue;
            }
          }

          if (!response.ok) {
            console.error(`Failed to fetch BRREG data for ${client.name} (${client.orgNumber}): ${response.status} ${response.statusText}`);
            failedClients.push(client.name);
            continue;
          }

          const data = await response.json();

          if (!data._embedded?.enheter || data._embedded.enheter.length === 0) {
            console.error(`No data found in BRREG for ${client.name} (${client.orgNumber})`);
            failedClients.push(client.name);
            continue;
          }

          const brregData = data._embedded.enheter[0];

          const { error: updateError } = await supabase
            .from('clients')
            .update({
              name: brregData.navn,
              industry: brregData.naeringskode1?.beskrivelse || client.industry,
              ceo: brregData.roller?.find((r: any) => r.type.kode === 'DAGL')?.person?.navn || client.ceo,
              chair: brregData.roller?.find((r: any) => r.type.kode === 'STYR')?.person?.navn || client.chair,
            })
            .eq('id', client.id);

          if (updateError) {
            console.error(`Database update error for ${client.name}: ${updateError.message}`);
            failedClients.push(client.name);
          } else {
            successCount++;
          }
        } catch (clientError) {
          console.error(`Error processing client ${client.name}: ${clientError}`);
          failedClients.push(client.name);
        }
      }

      if (apiAuthError) {
        setHasApiError(true);
      }

      await queryClient.invalidateQueries({ queryKey: ['clients'] });

      if (apiAuthError) {
        toast({
          title: "API-tilgangsfeil",
          description: "Kunne ikke koble til Brønnøysundregisteret. Sjekk at du har riktig API-nøkkel konfigurert.",
          variant: "destructive"
        });
      } else if (failedClients.length === 0) {
        toast({
          title: "Oppdatering fullført",
          description: `Alle ${successCount} klienter er oppdatert med nyeste data fra Brønnøysund`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Delvis oppdatering fullført",
          description: `${successCount} klienter oppdatert. ${failedClients.length} klienter kunne ikke oppdateres.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Feil ved oppdatering",
          description: "Kunne ikke oppdatere noen klienter. Sjekk at org.nr er korrekt og at API-tilgangen er konfigurert.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("General error during BRREG update:", error);
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke hente oppdatert data fra Brønnøysund. Vennligst prøv igjen senere.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return { handleRefreshBrregData, isRefreshing, hasApiError };
}
