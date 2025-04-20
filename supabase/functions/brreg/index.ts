
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

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    console.log("Auth header present:", !!authHeader);
    
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
    const fetchOptions = {};
    
    // Add the authorization header if it exists (passing it through from the client)
    if (authHeader) {
      console.log("Using authorization header for BRREG API request");
      fetchOptions.headers = { 'Authorization': authHeader };
    } else {
      console.log("No authorization header provided for BRREG API request");
    }
    
    try {
      baseResponse = await fetch(baseUrl, fetchOptions);
      console.log(`BRREG API response status: ${baseResponse.status}`);
      
      // If we get a 401 or 403, return a specific error to inform the client
      if (baseResponse.status === 401 || baseResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication error with Brønnøysund API',
            status: baseResponse.status,
            message: 'The Brønnøysund API requires authentication or the request was forbidden. Please check that valid API credentials are configured.'
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
      console.log("Base data received:", JSON.stringify(baseData).substring(0, 200) + "...");
      
      // Then get the roles information for this organization
      const rolesUrl = `${BRREG_ROLES_API}/enhet/${query}`;
      console.log("Fetching roles:", rolesUrl);
      
      let rolesData = { roller: [] };
      try {
        const rolesResponse = await fetch(rolesUrl, fetchOptions);
        console.log(`Roles API response status: ${rolesResponse.status}`);
        
        if (rolesResponse.ok) {
          rolesData = await rolesResponse.json();
          console.log("Roles data received:", JSON.stringify(rolesData).substring(0, 200) + "...");
        } else {
          console.log(`Roles API returned error status: ${rolesResponse.status}`);
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
        epost: baseData.epost || null,
        telefon: baseData.telefon || null,
        hjemmeside: baseData.hjemmeside || null,
      };
      
      // Format the response to match the search response format
      const response = {
        _embedded: {
          enheter: [enhancedData]
        },
        page: {
          totalElements: 1,
          totalPages: 1
        }
      };
      
      console.log("Returning enhanced data for org number");
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // For name searches, return the response as-is but with enhanced data
      const data = await baseResponse.json();
      console.log("Search data received:", JSON.stringify(data).substring(0, 200) + "...");
      
      // For each company in the search results, fetch additional data
      if (data._embedded?.enheter) {
        console.log(`Enhancing ${data._embedded.enheter.length} search results with roles data`);
        
        const enhancedEnheter = await Promise.all(
          data._embedded.enheter.map(async (enhet: any) => {
            const orgNr = enhet.organisasjonsnummer;
            const rolesUrl = `${BRREG_ROLES_API}/enhet/${orgNr}`;
            try {
              const rolesResponse = await fetch(rolesUrl, fetchOptions);
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
      
      console.log("Returning enhanced search results");
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
