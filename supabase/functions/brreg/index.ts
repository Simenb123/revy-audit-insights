
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BRREG_API_BASE = "https://data.brreg.no/enhetsregisteret/api/enheter";
const BRREG_ROLES_API = "https://data.brreg.no/enhetsregisteret/api/roller";

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
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the query looks like an organization number (9 digits)
    const isOrgNumber = /^\d{9}$/.test(query);
    
    let baseUrl;
    if (isOrgNumber) {
      // If it's an org number, use the direct endpoint
      baseUrl = `${BRREG_API_BASE}/${query}`;
      console.log("Searching by org number:", baseUrl);
    } else {
      // Otherwise search by name
      const searchParams = new URLSearchParams({
        navn: query,
        size: '10',
      });
      baseUrl = `${BRREG_API_BASE}?${searchParams.toString()}`;
      console.log("Searching by name:", baseUrl);
    }

    // First get the basic company information
    let baseResponse;
    try {
      baseResponse = await fetch(baseUrl);
      console.log(`BRREG API response status: ${baseResponse.status}`);
      
      // If we get a 401 or 403, return a specific error to inform the client
      if (baseResponse.status === 401 || baseResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication error with Brønnøysund API',
            status: baseResponse.status,
            message: 'The Brønnøysund API requires authentication or the request was forbidden.'
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError) {
      console.error("Error fetching from BRREG API:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Error connecting to Brønnøysund API',
          details: fetchError.message 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (isOrgNumber) {
      if (baseResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            _embedded: { 
              enheter: [] 
            },
            page: {
              totalElements: 0,
              totalPages: 0
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const baseData = await baseResponse.json();
      
      // Then get the roles information for this organization
      const rolesUrl = `${BRREG_ROLES_API}/enhet/${query}`;
      console.log("Fetching roles:", rolesUrl);
      
      let rolesData = { roller: [] };
      try {
        const rolesResponse = await fetch(rolesUrl);
        if (rolesResponse.ok) {
          rolesData = await rolesResponse.json();
        } else {
          console.log(`Roles API returned status: ${rolesResponse.status}`);
        }
      } catch (rolesError) {
        console.error("Error fetching roles:", rolesError);
      }
      
      // Combine the data
      const enhancedData = {
        ...baseData,
        roller: rolesData.roller || [],
        naeringskode1: baseData.naeringskode1 || {},
        organisasjonsform: baseData.organisasjonsform || {},
        forretningsadresse: baseData.forretningsadresse || {},
        institusjonellSektorkode: baseData.institusjonellSektorkode || {},
      };
      
      // Format the response to match the search response format
      return new Response(
        JSON.stringify({
          _embedded: {
            enheter: [enhancedData]
          },
          page: {
            totalElements: 1,
            totalPages: 1
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // For name searches, return the response as-is but with enhanced data
      const data = await baseResponse.json();
      
      // For each company in the search results, fetch additional data
      if (data._embedded?.enheter) {
        const enhancedEnheter = await Promise.all(
          data._embedded.enheter.map(async (enhet: any) => {
            const orgNr = enhet.organisasjonsnummer;
            const rolesUrl = `${BRREG_ROLES_API}/enhet/${orgNr}`;
            try {
              const rolesResponse = await fetch(rolesUrl);
              if (rolesResponse.ok) {
                const rolesData = await rolesResponse.json();
                return {
                  ...enhet,
                  roller: rolesData.roller || [],
                };
              } else {
                console.log(`Roles API returned status: ${rolesResponse.status} for ${orgNr}`);
                return enhet;
              }
            } catch (error) {
              console.error(`Error fetching roles for ${orgNr}:`, error);
              return enhet;
            }
          })
        );
        
        data._embedded.enheter = enhancedEnheter;
      }
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
