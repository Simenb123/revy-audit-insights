
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
          console.log(`Fetching BRREG data for ${client.name} (${client.orgNumber})`);
          const response = await fetch(`https://fxelhfwaoizqyecikscu.functions.supabase.co/brreg`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(authHeader ? { 'Authorization': authHeader } : {})
            },
            body: JSON.stringify({ query: client.orgNumber }),
          });

          // Check for API authentication errors (special handling)
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
          console.log(`Received BRREG data for ${client.name}:`, data);

          if (!data._embedded?.enheter || data._embedded.enheter.length === 0) {
            console.error(`No data found in BRREG for ${client.name} (${client.orgNumber})`);
            failedClients.push(client.name);
            continue;
          }

          const brregData = data._embedded.enheter[0];
          console.log(`Processing BRREG data for ${client.name}:`, brregData);

          // Extract CEO and Chair from roles if available
          let ceo = client.ceo;
          let chair = client.chair;

          if (brregData.roller && Array.isArray(brregData.roller)) {
            const dagligLeder = brregData.roller.find((r: any) => 
              r.type?.kode === 'DAGL' && r.person?.navn
            );
            
            const styreleder = brregData.roller.find((r: any) => 
              r.type?.kode === 'STYR' && r.person?.navn
            );

            if (dagligLeder?.person?.navn) {
              ceo = dagligLeder.person.navn;
              console.log(`Found CEO for ${client.name}: ${ceo}`);
            }

            if (styreleder?.person?.navn) {
              chair = styreleder.person.navn;
              console.log(`Found Chair for ${client.name}: ${chair}`);
            }
          } else {
            console.log(`No roles data found for ${client.name}`);
          }

          // Prepare industry data
          const industry = brregData.naeringskode1?.beskrivelse || client.industry;

          // Get address details
          const address = brregData.forretningsadresse?.adresse?.[0] || client.address;
          const postalCode = brregData.forretningsadresse?.postnummer || client.postalCode;
          const city = brregData.forretningsadresse?.poststed || client.city;

          // Update client data in database
          const updateData = {
            name: brregData.navn || client.name,
            industry: industry,
            ceo: ceo,
            chair: chair,
            address: address,
            postal_code: postalCode,
            city: city,
            registration_date: brregData.registreringsdatoEnhetsregisteret ? 
              new Date(brregData.registreringsdatoEnhetsregisteret).toISOString().split('T')[0] : 
              client.registrationDate
          };

          console.log(`Updating client ${client.name} with data:`, updateData);

          const { error: updateError } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', client.id);

          if (updateError) {
            console.error(`Database update error for ${client.name}: ${updateError.message}`);
            failedClients.push(client.name);
          } else {
            console.log(`Successfully updated ${client.name} in database`);
            successCount++;
          }
        } catch (clientError) {
          console.error(`Error processing client ${client.name}: `, clientError);
          failedClients.push(client.name);
        }
      }

      if (apiAuthError) {
        setHasApiError(true);
      }

      // Refresh client data
      await queryClient.invalidateQueries({ queryKey: ['clients'] });

      // Show appropriate toast messages
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
