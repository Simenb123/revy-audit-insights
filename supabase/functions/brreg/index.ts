import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BRREG_API_BASE = "https://data.brreg.no/enhetsregisteret/api/enheter";
const BRREG_ROLES_OPEN = "https://data.brreg.no/enhetsregisteret/api/enheter";
const BRREG_ROLES_AUTH = "https://data.brreg.no/enhetsregisteret/autorisert-api/enheter";

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
    
    // --------- ROLLER: Først mot åpent endepunkt ---------
    let rolesData = { roller: [] };
    let roller = [];
    let roleEndpointTried = "";
    let roleResponseStatus = 0;

    // 1: Åpent endepunkt
    const openRolesUrl = `${BRREG_ROLES_OPEN}/${query}/roller`;
    try {
      const rolesOpenResp = await fetch(openRolesUrl, fetchOptions);
      roleEndpointTried = "open";
      roleResponseStatus = rolesOpenResp.status;
      if (rolesOpenResp.ok) {
        const openData = await rolesOpenResp.json();
        rolesData = openData;
        roller = openData.roller || [];
        console.log(`[BRREG] Roller (open api) hentet for ${query}: #roller=${roller.length}`);
      } else if (rolesOpenResp.status === 404) {
        // 2: Fallback til autorisert dersom 404 og evt. Auth header finnes
        const authRolesUrl = `${BRREG_ROLES_AUTH}/${query}/roller`;
        const rolesAuthResp = await fetch(authRolesUrl, fetchOptions);
        roleEndpointTried = "auth";
        roleResponseStatus = rolesAuthResp.status;
        if (rolesAuthResp.ok) {
          const authData = await rolesAuthResp.json();
          rolesData = authData;
          roller = authData.roller || [];
          console.log(`[BRREG] Roller (autorisert api) hentet for ${query}: #roller=${roller.length}`);
        } else {
          console.log(`[BRREG] Roller (autorisert) 404 for ${query}`);
          rolesData = { roller: [] };
        }
      } else {
        console.log(`[BRREG] Roller-kall feilet for ${query}: status=${rolesOpenResp.status}`);
        rolesData = { roller: [] };
      }
    } catch (err) {
      console.error(`[BRREG] Roller-kall exception:`, err);
      rolesData = { roller: [] };
    }

    // Ekstra logging for feilsøk
    if (query === "922666997") {
      console.log("[DEBUG] Rå roller-payload:", JSON.stringify(roller, null, 2));
    }

    // — Mapping: CEO, chair, boardMembers —
    const processedRoles = processRolesStrict(roller);
    console.log("[BRREG] Processed roles:", JSON.stringify(processedRoles));
    
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
 * Strikt og eksplisitt mapping til CEO, Chair, BoardMembers basert kun på ønsket spesifikasjon.
 */
function processRolesStrict(roller) {
  const result = {
    ceo: null,
    chair: null,
    boardMembers: []
  };
  if (!roller || !Array.isArray(roller) || roller.length === 0) {
    return result;
  }

  // CEO: type="DAGL" eller rollebeskrivelse ~ "daglig leder"
  const ceoRole = roller.find(r =>
    (r.type === 'DAGL' || r.type?.kode === 'DAGL') ||
    (r.rolleBeskrivelse && /daglig leder/i.test(r.rolleBeskrivelse))
  );
  if (ceoRole && ceoRole.person) {
    let personName = ceoRole.person.navn
      ?? (ceoRole.person?.fornavn && ceoRole.person?.etternavn ? `${ceoRole.person.fornavn} ${ceoRole.person.etternavn}` : null);
    if (personName) {
      result.ceo = {
        name: personName,
        fromDate: ceoRole.fraTraadtTiltredtDato || ceoRole.fra ?? null,
        toDate: ceoRole.tilTraadtFraTredtDato || ceoRole.til ?? null,
        roleType: "CEO"
      };
    }
  }

  // Chair: type="STYR" og rollebeskrivelse ~ "styrets leder"
  const chairRole = roller.find(r =>
    (r.type === 'STYR' || r.type?.kode === 'STYR') &&
    r.rolleBeskrivelse && /styrets leder/i.test(r.rolleBeskrivelse)
  );
  if (chairRole && chairRole.person) {
    let personName = chairRole.person.navn
      ?? (chairRole.person?.fornavn && chairRole.person?.etternavn ? `${chairRole.person.fornavn} ${chairRole.person.etternavn}` : null);
    if (personName) {
      result.chair = {
        name: personName,
        fromDate: chairRole.fraTraadtTiltredtDato || chairRole.fra ?? null,
        toDate: chairRole.tilTraadtFraTredtDato || chairRole.til ?? null,
        roleType: "CHAIR"
      };
    }
  }

  // Alle øvrige STYR-roller (ikke chair) → boardMembers (roleType=MEMBER)
  roller.forEach(r => {
    let isChair = (r.type === 'STYR' || r.type?.kode === 'STYR')
      && r.rolleBeskrivelse
      && /styrets leder/i.test(r.rolleBeskrivelse);
    let isStyr = (r.type === 'STYR' || r.type?.kode === 'STYR');
    if (!isChair && isStyr && r.person) {
      let personName = r.person.navn
        ?? (r.person?.fornavn && r.person?.etternavn ? `${r.person.fornavn} ${r.person.etternavn}` : null);
      if (personName) {
        result.boardMembers.push({
          name: personName,
          fromDate: r.fraTraadtTiltredtDato || r.fra ?? null,
          toDate: r.tilTraadtFraTredtDato || r.til ?? null,
          roleType: "MEMBER",
          description: r.rolleBeskrivelse || ""
        });
      }
    }
  });
  return result;
}
