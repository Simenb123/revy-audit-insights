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
    
    // Process roles for enhanced list
    const processedRoles = processRolesV2(rolesData.roller || []);
    
    // Extract address info (full address array, postnummer, poststed, kommune)
    const forretningsadresse = baseData.forretningsadresse || {};
    const email = (baseData.hjemmeside && typeof baseData.hjemmeside === 'object')
        ? baseData.hjemmeside.adresseEpost
        : baseData.epost;

    // Map municipality name/code (some are on forretningsadresse, fallback to kommune directly)
    let municipalityCode = forretningsadresse.kommunenummer || (forretningsadresse.kommune && forretningsadresse.kommune.kommunenummer) || baseData.kommune?.kommunenummer || null;
    let municipalityName = forretningsadresse.kommune || baseData.kommune?.kommune || null;
    if (typeof municipalityName === "object" && "navn" in municipalityName) {
      municipalityName = municipalityName.navn;
    } else if (typeof municipalityName === "string") {
      // keep as is
    } else {
      municipalityName = null;
    }

    // Extract homepage from hjemmmeside field directly (may be string or object)
    let homepage = baseData.hjemmeside;
    if (homepage && typeof homepage === "object" && homepage.adresseUrl) {
      homepage = homepage.adresseUrl;
    }

    // Try to extract capital fields (aksjekapital, aksjekapitalNOK, innskuddskapital)
    let equityCapital = null;
    if (baseData.kapital) {
      if (baseData.kapital.aksjekapitalNOK) {
        equityCapital = baseData.kapital.aksjekapitalNOK;
      } else if (baseData.kapital.aksjekapital) {
        equityCapital = baseData.kapital.aksjekapital;
      }
    }

    let shareCapital = null;
    if (baseData.kapital) {
      if (baseData.kapital.innskuddskapital) {
        shareCapital = baseData.kapital.innskuddskapital;
      }
    }

    // Build enhanced data object, taking from BRREG mapping table
    const enhancedData = {
      basis: {
        organisasjonsnummer: baseData.organisasjonsnummer,
        navn: baseData.navn,
        organisasjonsform: baseData.organisasjonsform || {},
        status: baseData.status || "ACTIVE",
        registreringsdatoEnhetsregisteret: baseData.registreringsdatoEnhetsregisteret,
        naeringskode1: baseData.naeringskode1 || {},
        postadresse: baseData.postadresse || {},
        forretningsadresse: forretningsadresse,
        addressLines: Array.isArray(forretningsadresse.adresse) ? forretningsadresse.adresse : (forretningsadresse.adresse ? [forretningsadresse.adresse] : []),
        postalCode: forretningsadresse.postnummer || null,
        city: forretningsadresse.poststed || null,
        kommune: {
          kommunenummer: municipalityCode,
          navn: municipalityName
        },
        institusjonellSektorkode: baseData.institusjonellSektorkode || {},
        telefon: baseData.telefonnummer || baseData.telefon || null,
        email: email || null,
        homepage: homepage || null,
        kapital: {
          equityCapital: equityCapital,
          shareCapital: shareCapital
        }
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
function processRolesV2(roller) {
  const result = {
    ceo: null,
    chair: null,
    boardMembers: []
  };
  if (!roller || !Array.isArray(roller)) return result;

  roller.forEach(role => {
    try {
      const personName = role.person?.navn;
      if (!personName) return;
      const fromDate = role.fraTraadtTiltredtDato || null;
      const toDate = role.tilTraadtFraTredtDato || null;
      const roleType = role.type?.kode || "";
      const description = role.rolleBeskrivelse || "";
      if (roleType === "DAGL") {
        // CEO
        result.ceo = {
          name: personName,
          fromDate,
          toDate,
          roleType: "CEO"
        };
      } else if (roleType === "STYR" && description === "Styrets leder") {
        result.chair = {
          name: personName,
          fromDate,
          toDate,
          roleType: "CHAIR"
        };
      } else if (roleType === "STYR") {
        result.boardMembers.push({
          name: personName,
          fromDate,
          toDate,
          roleType: "MEMBER",
          description
        });
      } else if (roleType === "SIGNER") {
        result.boardMembers.push({
          name: personName,
          fromDate,
          toDate,
          roleType: "SIGNATORY",
          description: "Signaturberettiget"
        });
      }
    } catch (e) {}
  });
  return result;
}

/**
 * Extract capital information from the Brønnøysund data
 */
function extractCapital(data) {
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
