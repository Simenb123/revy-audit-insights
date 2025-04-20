
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
    let updatedClientsData: Record<string, any> = {};

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
          let ceo = client.ceo || "";
          let chair = client.chair || "";

          if (brregData.roller && Array.isArray(brregData.roller)) {
            // Find CEO (daglig leder)
            const dagligLeder = brregData.roller.find((r: any) => 
              r.type?.kode === 'DAGL' && r.person?.navn
            );
            
            // Find Chairman (styreleder)
            const styreleder = brregData.roller.find((r: any) => 
              r.type?.kode === 'STYR' && r.person?.navn && r.rolleBeskrivelse === 'Styrets leder'
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
          const industry = brregData.naeringskode1?.beskrivelse || client.industry || "";

          // Get address details
          const address = brregData.forretningsadresse?.adresse?.[0] || client.address || "";
          const postalCode = brregData.forretningsadresse?.postnummer || client.postalCode || "";
          const city = brregData.forretningsadresse?.poststed || client.city || "";
          
          // Get registration date
          const registrationDate = brregData.registreringsdatoEnhetsregisteret ? 
            new Date(brregData.registreringsdatoEnhetsregisteret).toISOString().split('T')[0] : 
            client.registrationDate || "";

          // Get contact information if available
          const email = brregData.epost || client.email || "";
          const phone = brregData.telefon || client.phone || "";
          
          // Get company name
          const companyName = brregData.navn || client.companyName || "";

          // Update client data in database
          const updateData = {
            name: brregData.navn || client.name,
            company_name: companyName,
            industry: industry,
            ceo: ceo,
            chair: chair,
            address: address,
            postal_code: postalCode,
            city: city,
            registration_date: registrationDate,
            email: email,
            phone: phone
          };

          console.log(`Updating client ${client.name} with data:`, updateData);

          const { error: updateError, data: updatedData } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', client.id)
            .select();

          if (updateError) {
            console.error(`Database update error for ${client.name}: ${updateError.message}`);
            failedClients.push(client.name);
          } else {
            console.log(`Successfully updated ${client.name} in database. Response:`, updatedData);
            successCount++;
            // Store update confirmation data for validation
            if (updatedData && updatedData.length > 0) {
              updatedClientsData[client.id] = updateData;
            }
          }
        } catch (clientError) {
          console.error(`Error processing client ${client.name}: `, clientError);
          failedClients.push(client.name);
        }
      }

      if (apiAuthError) {
        setHasApiError(true);
      }

      // Validate database updates by fetching the latest data
      if (successCount > 0) {
        try {
          console.log("Validating database updates...");
          const clientIds = Object.keys(updatedClientsData);
          const { data: latestClientData, error: fetchError } = await supabase
            .from('clients')
            .select('id, name, company_name, industry, ceo, chair, address, postal_code, city, registration_date, email, phone')
            .in('id', clientIds);
            
          if (fetchError) {
            console.error("Error validating database updates:", fetchError);
          } else if (latestClientData) {
            console.log("Latest client data from database:", latestClientData);
            // Check if updates were actually applied
            let allUpdatesConfirmed = true;
            for (const client of latestClientData) {
              const expectedData = updatedClientsData[client.id];
              if (!expectedData) continue;
              
              // Validate key fields
              const fieldsToCheck = ['name', 'company_name', 'industry', 'ceo', 'chair', 'address', 'postal_code', 'city', 'registration_date', 'email', 'phone'];
              for (const field of fieldsToCheck) {
                const dbField = field.includes('_') ? field : field; // Handle case differences
                if (expectedData[field] && client[dbField] !== expectedData[field]) {
                  console.warn(`Update discrepancy for client ${client.name}, field ${field}:`, {
                    expected: expectedData[field],
                    actual: client[dbField]
                  });
                  allUpdatesConfirmed = false;
                }
              }
            }
            
            if (!allUpdatesConfirmed) {
              console.warn("Some updates may not have been fully applied to the database");
            } else {
              console.log("All database updates confirmed successful");
            }
          }
        } catch (validationError) {
          console.error("Error during update validation:", validationError);
        }
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
      } else if (failedClients.length === 0 && successCount > 0) {
        toast({
          title: "Oppdatering fullført",
          description: `Alle ${successCount} klienter er oppdatert med nyeste data fra Brønnøysund og lagret i databasen`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Delvis oppdatering fullført",
          description: `${successCount} klienter oppdatert og lagret i databasen. ${failedClients.length} klienter kunne ikke oppdateres.`,
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
