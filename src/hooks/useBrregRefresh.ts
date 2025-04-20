
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

    try {
      // Get the current session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      
      // Prepare authorization header if we have a session
      const authHeader = session ? `Bearer ${session.access_token}` : undefined;
      
      // Process each client
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        // Update progress
        setRefreshProgress(Math.round(((i) / clients.length) * 100));
        
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

          // Check for various error conditions
          if (response.status === 404) {
            console.error(`No data found in BRREG for ${client.name} (${client.orgNumber})`);
            failedClients.push(client.name);
            continue;
          }
          
          if (response.status === 429) {
            console.error(`Rate limit exceeded for BRREG API when fetching ${client.name} (${client.orgNumber})`);
            failedClients.push(client.name);
            // We could implement a retry mechanism with exponential backoff here
            continue;
          }
          
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

          if (!data.basis || !data.basis.organisasjonsnummer) {
            console.error(`Invalid data format from BRREG for ${client.name} (${client.orgNumber})`);
            failedClients.push(client.name);
            continue;
          }

          // Extract data from the enhanced response
          const basisData = data.basis;
          const rolesData = data.roles;
          
          console.log(`Processing BRREG data for ${client.name}:`, { basis: basisData, roles: rolesData });

          // Prepare client update data
          const updateData = {
            name: basisData.navn || client.name,
            company_name: basisData.navn || client.companyName,
            org_form_code: basisData.organisasjonsform?.kode || null,
            org_form_description: basisData.organisasjonsform?.beskrivelse || null,
            homepage: basisData.hjemmeside || null,
            status: basisData.status || null,
            nace_code: basisData.naeringskode1?.kode || null,
            nace_description: basisData.naeringskode1?.beskrivelse || null,
            industry: basisData.naeringskode1?.beskrivelse || client.industry || null,
            municipality_code: basisData.kommune?.kode || null,
            municipality_name: basisData.kommune?.navn || null,
            address: basisData.forretningsadresse?.adresse?.[0] || client.address || null,
            postal_code: basisData.forretningsadresse?.postnummer || client.postalCode || null,
            city: basisData.forretningsadresse?.poststed || client.city || null,
            registration_date: basisData.registreringsdatoEnhetsregisteret ? 
              new Date(basisData.registreringsdatoEnhetsregisteret).toISOString().split('T')[0] : 
              client.registrationDate || null,
            email: basisData.epost || client.email || null,
            phone: basisData.telefon || client.phone || null,
            ceo: rolesData.ceo?.name || client.ceo || null,
            chair: rolesData.chair?.name || client.chair || null,
            equity_capital: basisData.kapital?.equityCapital?.amount || null,
            share_capital: basisData.kapital?.shareCapital?.amount || null
          };

          console.log(`Updating client ${client.name} with data:`, updateData);

          // Update client data in database
          const { error: updateError, data: updatedData } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', client.id)
            .select();

          if (updateError) {
            console.error(`Database update error for ${client.name}: ${updateError.message}`);
            failedClients.push(client.name);
            continue;
          }
          
          console.log(`Successfully updated ${client.name} in database. Response:`, updatedData);
          
          // Process roles data
          if (rolesData && (rolesData.ceo || rolesData.chair || (rolesData.boardMembers && rolesData.boardMembers.length > 0))) {
            try {
              // First, delete existing roles for this client
              const { error: deleteError } = await supabase
                .from('client_roles')
                .delete()
                .eq('client_id', client.id);
                
              if (deleteError) {
                console.error(`Error deleting existing roles for ${client.name}: ${deleteError.message}`);
              }
              
              // Prepare roles for insertion
              const rolesToInsert = [];
              
              // Add CEO if present
              if (rolesData.ceo) {
                rolesToInsert.push({
                  client_id: client.id,
                  role_type: 'CEO',
                  name: rolesData.ceo.name,
                  from_date: rolesData.ceo.fromDate || null,
                  to_date: rolesData.ceo.toDate || null
                });
              }
              
              // Add Chair if present
              if (rolesData.chair) {
                rolesToInsert.push({
                  client_id: client.id,
                  role_type: 'CHAIR',
                  name: rolesData.chair.name,
                  from_date: rolesData.chair.fromDate || null,
                  to_date: rolesData.chair.toDate || null
                });
              }
              
              // Add board members
              if (rolesData.boardMembers && rolesData.boardMembers.length > 0) {
                for (const member of rolesData.boardMembers) {
                  rolesToInsert.push({
                    client_id: client.id,
                    role_type: member.roleType || 'MEMBER',
                    name: member.name,
                    from_date: member.fromDate || null,
                    to_date: member.toDate || null
                  });
                }
              }
              
              // Insert roles if we have any
              if (rolesToInsert.length > 0) {
                const { error: insertError, data: insertedRoles } = await supabase
                  .from('client_roles')
                  .insert(rolesToInsert)
                  .select();
                  
                if (insertError) {
                  console.error(`Error inserting roles for ${client.name}: ${insertError.message}`);
                } else {
                  console.log(`Successfully inserted ${insertedRoles.length} roles for ${client.name}`);
                }
              }
            } catch (rolesError) {
              console.error(`Error processing roles for ${client.name}:`, rolesError);
            }
          }
          
          successCount++;
          // Store update confirmation data for validation
          if (updatedData && updatedData.length > 0) {
            updatedClientsData[client.id] = updateData;
          }
        } catch (clientError) {
          console.error(`Error processing client ${client.name}: `, clientError);
          failedClients.push(client.name);
        }
      }

      // Final progress update
      setRefreshProgress(100);

      if (apiAuthError) {
        setHasApiError(true);
      }

      // Refresh client data in React Query
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
      setRefreshProgress(0);
    }
  };

  return { handleRefreshBrregData, isRefreshing, hasApiError, refreshProgress };
}
