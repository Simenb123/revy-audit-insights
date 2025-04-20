import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BRREG_API_BASE = "https://data.brreg.no/enhetsregisteret/api/enheter";

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
    
    let url;
    if (isOrgNumber) {
      // If it's an org number, use the direct endpoint
      url = `${BRREG_API_BASE}/${query}`;
      console.log("Searching by org number:", url);
    } else {
      // Otherwise search by name
      const searchParams = new URLSearchParams({
        navn: query,
        size: '10',
      });
      url = `${BRREG_API_BASE}?${searchParams.toString()}`;
      console.log("Searching by name:", url);
    }

    const response = await fetch(url);
    
    // If searching by org number directly, wrap the response in the expected format
    if (isOrgNumber) {
      if (response.status === 404) {
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
      
      const data = await response.json();
      
      // Format the single entity response to match the search response format
      return new Response(
        JSON.stringify({
          _embedded: {
            enheter: [data]
          },
          page: {
            totalElements: 1,
            totalPages: 1
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // For name searches, return the response as-is
      const data = await response.json();
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
