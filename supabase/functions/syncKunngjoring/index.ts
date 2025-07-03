import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from "../test_deps.ts";
import { log } from "../_shared/log.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request parameters
    const { orgNumbers } = await req.json();
    
    // Get the Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let processed = 0;
    let totalInserted = 0;
    const results = [];
    
    // Process each organization number
    if (Array.isArray(orgNumbers) && orgNumbers.length > 0) {
      for (const orgNumber of orgNumbers) {
        try {
          log(`Processing org number: ${orgNumber}`);
          
          // Fetch client info to get the client ID
          const { data: client, error: clientError } = await supabase
            .from("clients")
            .select("id, name")
            .eq("org_number", orgNumber)
            .single();
            
          if (clientError || !client) {
            console.error(`Error fetching client with org number ${orgNumber}:`, clientError);
            results.push({ orgNumber, status: "error", error: `Client not found: ${clientError?.message || "Unknown error"}` });
            continue;
          }
          
          // --- PRIMÆR: Prøv JSON-endepunktet først ---
          let announcements = [];
          let fetchedFrom = "json";
          const jsonUrl = `https://data.brreg.no/kunngjoring/hent?orgnr=${orgNumber}&sprak=no`;
          let response = await fetch(jsonUrl);
          
          if (response.status === 404) {
            // Fallback til HTML-endepunkt
            const htmlUrl = `https://w2.brreg.no/kunngjoring/hent_nr.jsp?orgnr=${orgNumber}&spraak=no`;
            response = await fetch(htmlUrl);
            fetchedFrom = "html";
          }
          
          if (!response.ok) {
            console.error(`Error fetching announcements for ${orgNumber}:`, response.status);
            results.push({ orgNumber, status: "error", error: `HTTP error: ${response.status}` });
            continue;
          }

          if (fetchedFrom === "json") {
            const json = await response.json();
            if (Array.isArray(json.resultat)) {
              announcements = json.resultat.slice(0, 100).map(entry => ({
                client_id: client.id,
                announcement_id: entry.kunngjormingsId || entry.KID || crypto.randomUUID(),
                org_number: orgNumber,
                announcement_date: entry.dato ? new Date(entry.dato).toISOString() : new Date().toISOString(),
                title: entry.tittel || "",
                type: entry.type || "",
                normalized_type: (entry.type || "").toLowerCase(),
                details_url: entry.url ? String(entry.url) : "",
                kid: entry.KID || null,
                created_at: new Date().toISOString()
              }));
            }
          } else if (fetchedFrom === "html") {
            const html = await response.text();
            announcements = parseAnnouncementsHtml(html, client.id, orgNumber).slice(0, 100);
          }

          log(`Fetched ${announcements.length} announcements from ${fetchedFrom} for ${client.name} (${orgNumber})`);

          if (announcements.length === 0) {
            results.push({ orgNumber, status: "success", inserted: 0 });
            continue;
          }

          // Upsert announcements
          const { data: insertedData, error: insertError } = await supabase
            .from("announcements")
            .upsert(announcements, { 
              onConflict: "client_id,announcement_id",
              ignoreDuplicates: false 
            });

            if (insertError) {
              console.error(`Error inserting announcements for ${orgNumber}:`, insertError);
              results.push({ orgNumber, status: "error", error: `Insert error: ${insertError.message}` });
              continue;
            }

            // Logg faktisk insert count
            const inserted = Array.isArray(insertedData) ? insertedData : [];
            log("Inserted announcements:", inserted.length);

            results.push({ 
              orgNumber, 
              status: "success", 
              inserted: announcements.length,
              clientName: client.name
            });
            processed++;
            totalInserted += announcements.length;
          } catch (error) {
            console.error(`Error processing org number ${orgNumber}:`, error);
            results.push({ orgNumber, status: "error", error: error.message });
          }
        }
      } else {
        // If no specific org numbers provided, process all clients
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select("id, name, org_number")
          .not("org_number", "is", null);
        
        if (clientsError) {
          throw new Error(`Error fetching clients: ${clientsError.message}`);
        }
        
        log(`Processing announcements for ${clients.length} clients`);
        
        for (const client of clients) {
          try {
            if (!client.org_number) continue;
            
            // Fetch announcements from Brønnøysund
            const url = `https://w2.brreg.no/kunngjoring/hent_nr.jsp?orgnr=${client.org_number}&spraak=no`;
            const response = await fetch(url);
            
            if (!response.ok) {
              console.error(`Error fetching announcements for ${client.name}:`, response.status);
              results.push({ orgNumber: client.org_number, status: "error", error: `HTTP error: ${response.status}` });
              continue;
            }
            
            const html = await response.text();
            
            // Parse the HTML to extract announcements
            const announcements = parseAnnouncementsHtml(html, client.id, client.org_number);
            log(`Found ${announcements.length} announcements for ${client.name} (${client.org_number})`);
            
            if (announcements.length === 0) {
              results.push({ orgNumber: client.org_number, status: "success", inserted: 0, message: "No announcements found" });
              continue;
            }
            
            // Insert announcements into the database
            const { error: insertError } = await supabase
              .from("announcements")
              .upsert(announcements, { 
                onConflict: "client_id,announcement_id",
                ignoreDuplicates: false 
              });
            
            if (insertError) {
              console.error(`Error inserting announcements for ${client.name}:`, insertError);
              results.push({ orgNumber: client.org_number, status: "error", error: `Insert error: ${insertError.message}` });
              continue;
            }
            
            log(`Successfully processed ${announcements.length} announcements for ${client.name}`);
            results.push({ 
              orgNumber: client.org_number, 
              status: "success", 
              inserted: announcements.length,
              clientName: client.name
            });
            
            processed++;
            totalInserted += announcements.length;
          } catch (error) {
            console.error(`Error processing client ${client.name}:`, error);
            results.push({ orgNumber: client.org_number, status: "error", error: error.message });
          }
        }
      }
    
    log(`Processed ${processed} clients, inserted ${totalInserted} announcements`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed,
        inserted: totalInserted,
        results 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing announcements:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

/**
 * Parse announcements HTML from Brønnøysund
 */
function parseAnnouncementsHtml(html: string, clientId: string, orgNumber: string): any[] {
  const announcements = [];
  
  // Use regex to extract announcements from the HTML
  const announcementBlocks = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
  
  for (const block of announcementBlocks) {
    try {
      // Skip header rows and rows without proper announcement data
      if (block.includes("overskriftliste") || !block.includes("<td")) {
        continue;
      }
      
      // Extract cells from the row
      const cells = block.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
      if (cells.length < 3) continue;
      
      // Extract date from first cell
      const dateMatch = cells[0].match(/(\d{2}\.\d{2}\.\d{4})/);
      if (!dateMatch || !dateMatch[1]) continue;
      
      const dateStr = dateMatch[1];
      const dateParts = dateStr.split('.');
      const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      
      // Extract announcement type and title
      let announcementType = cells[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      const title = cells[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
      
      // Extract KID and details link if available
      let kid = '';
      let detailsUrl = '';
      const linkMatch = cells[2].match(/href="([^"]+)"/);
      
      if (linkMatch && linkMatch[1]) {
        detailsUrl = `https://w2.brreg.no/kunngjoring/${linkMatch[1]}`;
        const kidMatch = detailsUrl.match(/KID=([^&]+)/);
        if (kidMatch && kidMatch[1]) {
          kid = kidMatch[1];
        }
      }
      
      // Generate unique ID using client_id and kid
      const announcementId = kid || `${dateStr}-${announcementType.substring(0, 10)}-${title.substring(0, 10)}`;
      
      // Normalize announcement type to one of the main categories
      let normalizedType = announcementType.toLowerCase();
      if (normalizedType.includes('konkurs')) {
        normalizedType = 'konkurs';
      } else if (normalizedType.includes('fusjon')) {
        normalizedType = 'fusjon';
      } else if (normalizedType.includes('kapital')) {
        normalizedType = 'kapital';
      } else if (normalizedType.includes('vedtekt')) {
        normalizedType = 'vedtekt';
      } else if (normalizedType.includes('stift')) {
        normalizedType = 'stiftelse';
      } else if (normalizedType.includes('opplys')) {
        normalizedType = 'opplysning';
      } else {
        normalizedType = 'annet';
      }
      
      announcements.push({
        client_id: clientId,
        announcement_id: announcementId,
        org_number: orgNumber,
        announcement_date: date.toISOString(),
        title,
        type: announcementType,
        normalized_type: normalizedType,
        details_url: detailsUrl,
        kid,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error parsing announcement block:', error);
      // Continue with next block
    }
  }
  
  return announcements;
}
