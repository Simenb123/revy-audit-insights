
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
    
    if (!isOrgNumber) {
      // For name searches, proceed as before
      const searchParams = new URLSearchParams({
        navn: query,
        size: '10',
      });
      const searchUrl = `${BRREG_API_BASE}?${searchParams.toString()}`;
      console.log("Searching by name:", searchUrl);
      
      const fetchOptions = authHeader ? { headers: { 'Authorization': authHeader } } : {};
      const response = await fetch(searchUrl, fetchOptions);
      
      if (!response.ok) {
        console.error(`Error searching for company by name. Status: ${response.status}`);
        if (response.status === 401 || response.status === 403) {
          return new Response(
            JSON.stringify({ 
              error: 'Authentication error with Brønnøysund API',
              status: response.status,
              message: 'The Brønnøysund API requires authentication or the request was forbidden. Please check that valid API credentials are configured.'
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              status: response.status,
              message: 'The Brønnøysund API rate limit has been exceeded. Please try again later.'
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: 'Error from Brønnøysund API',
            status: response.status 
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const data = await response.json();
      console.log("Search data received:", JSON.stringify(data).substring(0, 200) + "...");
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If it's an org number, fetch detailed information
    console.log(`Fetching detailed information for org number: ${query}`);
    
    const fetchOptions = authHeader ? { headers: { 'Authorization': authHeader } } : {};
    
    // Fetch the basic organization information
    const baseUrl = `${BRREG_API_BASE}/${query}`;
    console.log("Fetching basic info:", baseUrl);
    
    const baseResponse = await fetch(baseUrl, fetchOptions);
    
    // Handle various error responses
    if (!baseResponse.ok) {
      console.error(`Error fetching company data. Status: ${baseResponse.status}`);
      
      if (baseResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'Organization not found',
            status: 404,
            message: `No organization found with organization number: ${query}`
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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
      
      if (baseResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            status: baseResponse.status,
            message: 'The Brønnøysund API rate limit has been exceeded. Please try again later.'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Error from Brønnøysund API',
          status: baseResponse.status 
        }),
        { status: baseResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    
    // Process roles to extract CEO, Chair, and board members
    const processedRoles = processRoles(rolesData.roller || []);
    
    // Combine the data into one comprehensive object
    const enhancedData = {
      basis: {
        organisasjonsnummer: baseData.organisasjonsnummer,
        navn: baseData.navn,
        organisasjonsform: baseData.organisasjonsform || {},
        status: baseData.status || "ACTIVE",
        registreringsdatoEnhetsregisteret: baseData.registreringsdatoEnhetsregisteret,
        hjemmeside: baseData.hjemmeside,
        naeringskode1: baseData.naeringskode1 || {},
        postadresse: baseData.postadresse || {},
        forretningsadresse: baseData.forretningsadresse || {},
        institusjonellSektorkode: baseData.institusjonellSektorkode || {},
        epost: baseData.epost,
        telefon: baseData.telefon,
        kapital: extractCapital(baseData),
        kommune: baseData.kommune || {}
      },
      roles: processedRoles
    };
    
    console.log("Returning enhanced data object");
    return new Response(
      JSON.stringify(enhancedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('General error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process roles from Brønnøysund API to extract CEO, Chair and board members
 */
function processRoles(roller: any[]) {
  const result = {
    ceo: null,
    chair: null,
    boardMembers: []
  };
  
  if (!roller || !Array.isArray(roller)) {
    console.log("No roles data available or data is not an array");
    return result;
  }
  
  console.log(`Processing ${roller.length} roles`);
  
  roller.forEach(role => {
    try {
      // Extract person name if available
      const personName = role.person?.navn;
      
      if (!personName) {
        // Skip roles without a person name
        return;
      }
      
      // Extract from and to dates if available
      const fromDate = role.fraTraadtTiltredtDato || null;
      const toDate = role.tilTraadtFraTredtDato || null;
      
      // Process based on role type
      if (role.type?.kode === 'DAGL' && role.person?.navn) {
        // CEO (Daglig leder)
        result.ceo = {
          name: personName,
          fromDate,
          toDate,
          roleType: 'CEO'
        };
        console.log(`Found CEO: ${personName}`);
      } 
      else if (role.type?.kode === 'STYR' && role.rolleBeskrivelse === 'Styrets leder' && role.person?.navn) {
        // Chair (Styreleder)
        result.chair = {
          name: personName,
          fromDate,
          toDate,
          roleType: 'CHAIR'
        };
        console.log(`Found Chair: ${personName}`);
      }
      else if (role.type?.kode === 'STYR' && role.person?.navn) {
        // Board member (Styremedlem)
        result.boardMembers.push({
          name: personName,
          fromDate,
          toDate,
          roleType: 'MEMBER',
          description: role.rolleBeskrivelse || 'Styremedlem'
        });
        console.log(`Found board member: ${personName}`);
      }
      else if (role.type?.kode === 'SIGNER' && role.person?.navn) {
        // Signatory (Signaturberettiget)
        result.boardMembers.push({
          name: personName,
          fromDate,
          toDate,
          roleType: 'SIGNATORY',
          description: 'Signaturberettiget'
        });
        console.log(`Found signatory: ${personName}`);
      }
    } catch (e) {
      console.error(`Error processing role: ${JSON.stringify(role).substring(0, 100)}...`, e);
    }
  });
  
  return result;
}

/**
 * Extract capital information from the Brønnøysund data
 */
function extractCapital(data: any) {
  const result = {
    shareCapital: null,
    equityCapital: null
  };
  
  if (!data) return result;
  
  try {
    // Extract share capital if available
    if (data.aksjekapital) {
      result.shareCapital = {
        amount: data.aksjekapital,
        currency: 'NOK'
      };
    } else if (data.andelsinnskudd) {
      result.shareCapital = {
        amount: data.andelsinnskudd,
        currency: 'NOK'
      };
    }
    
    // Extract equity capital if available
    if (data.egenkapital) {
      result.equityCapital = {
        amount: data.egenkapital,
        currency: 'NOK'
      };
    }
  } catch (e) {
    console.error("Error extracting capital information:", e);
  }
  
  return result;
}
