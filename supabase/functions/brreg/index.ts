
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
        console.log("Total roles count:", rolesData.roller ? rolesData.roller.length : 0);
        
        // Special debugging for the specific org number mentioned in the user's request
        if (query === '922666997') {
          console.log("Detailed roles for requested org:", JSON.stringify(rolesData.roller, null, 2));
        }
      } else {
        console.log(`Roles API returned error status: ${rolesResponse.status}`);
      }
    } catch (rolesError) {
      console.error("Error fetching roles:", rolesError);
    }
    
    // Process roles for enhanced list
    const processedRoles = processRolesV2(rolesData.roller || []);
    console.log("Processed roles:", JSON.stringify(processedRoles).substring(0, 200) + "...");
    
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

    // Extract capital fields from various possible locations
    let equityCapital = null;
    let shareCapital = null;

    if (baseData.kapital) {
      // First check for aksjekapital (share capital)
      if (baseData.kapital.aksjekapital) {
        shareCapital = parseFloat(baseData.kapital.aksjekapital);
      } else if (baseData.kapital.aksjekapitalNOK) {
        shareCapital = parseFloat(baseData.kapital.aksjekapitalNOK);
      }
      
      // Then check for innskuddskapital (equity capital)
      if (baseData.kapital.innskuddskapital) {
        equityCapital = parseFloat(baseData.kapital.innskuddskapital);
      }
    }

    // If we have found no equity capital but we have share capital, use that
    if (equityCapital === null && shareCapital !== null) {
      equityCapital = shareCapital;
    }

    // Log capital information to help debug
    console.log("Capital information:", { 
      rawKapital: baseData.kapital,
      extractedEquityCapital: equityCapital,
      extractedShareCapital: shareCapital
    });

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
  
  if (!roller || !Array.isArray(roller) || roller.length === 0) {
    console.log("No roles found or invalid roles data");
    return result;
  }

  console.log(`Processing ${roller.length} roles`);
  
  // First, let's look for the CEO role
  const ceoRole = roller.find(role => 
    (role.type?.kode === "DAGL") || 
    (role.rolleBeskrivelse && /daglig leder/i.test(role.rolleBeskrivelse))
  );
  
  if (ceoRole) {
    let personName = null;
    if (ceoRole.person?.navn) {
      personName = ceoRole.person.navn;
    } else if (ceoRole.person?.navn?.fornavn && ceoRole.person?.navn?.etternavn) {
      personName = `${ceoRole.person.navn.fornavn} ${ceoRole.person.navn.etternavn}`;
    }
    
    if (personName) {
      console.log(`Found CEO: ${personName}`);
      result.ceo = {
        name: personName,
        fromDate: ceoRole.fraTraadtTiltredtDato || null,
        toDate: ceoRole.tilTraadtFraTredtDato || null,
        roleType: "CEO"
      };
    }
  }
  
  // Then, look for the Chair role
  const chairRole = roller.find(role => 
    (role.type?.kode === "STYR" && role.rolleBeskrivelse && /styrets leder/i.test(role.rolleBeskrivelse))
  );
  
  if (chairRole) {
    let personName = null;
    if (chairRole.person?.navn) {
      personName = chairRole.person.navn;
    } else if (chairRole.person?.navn?.fornavn && chairRole.person?.navn?.etternavn) {
      personName = `${chairRole.person.navn.fornavn} ${chairRole.person.navn.etternavn}`;
    }
    
    if (personName) {
      console.log(`Found Chair: ${personName}`);
      result.chair = {
        name: personName,
        fromDate: chairRole.fraTraadtTiltredtDato || null,
        toDate: chairRole.tilTraadtFraTredtDato || null,
        roleType: "CHAIR"
      };
    }
  }
  
  // Process all board members and signatories
  roller.forEach((role) => {
    try {
      // Extract the person's name
      let personName = null;
      if (role.person?.navn) {
        personName = role.person.navn;
      } else if (role.person?.navn?.fornavn && role.person?.navn?.etternavn) {
        personName = `${role.person.navn.fornavn} ${role.person.navn.etternavn}`;
      }
      
      if (!personName) {
        return;
      }
      
      const fromDate = role.fraTraadtTiltredtDato || null;
      const toDate = role.tilTraadtFraTredtDato || null;
      const roleType = role.type?.kode || "";
      const description = role.rolleBeskrivelse || "";
      
      // Skip already processed CEO and Chair roles to avoid duplicates
      if ((result.ceo && result.ceo.name === personName && roleType === "DAGL") ||
          (result.chair && result.chair.name === personName && roleType === "STYR" && /styrets leder/i.test(description))) {
        return;
      }
      
      // Board member - look for 'STYR' role type
      if (roleType === "STYR") {
        console.log(`Found Board Member: ${personName}`);
        result.boardMembers.push({
          name: personName,
          fromDate,
          toDate,
          roleType: "MEMBER",
          description
        });
      } 
      // Signatory - look for 'SIGNER' role type
      else if (roleType === "SIGNER") {
        console.log(`Found Signatory: ${personName}`);
        result.boardMembers.push({
          name: personName,
          fromDate,
          toDate,
          roleType: "SIGNATORY",
          description: "Signaturberettiget"
        });
      }
    } catch (e) {
      console.error(`Error processing role:`, e);
    }
  });
  
  console.log(`Processed roles: CEO: ${result.ceo ? 'Found' : 'Not found'}, Chair: ${result.chair ? 'Found' : 'Not found'}, Board Members: ${result.boardMembers.length}`);
  return result;
}
