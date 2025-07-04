import { log } from "../_shared/log.ts";
import { handleBrregError } from "../_shared/brregError.ts";

const kv = await Deno.openKv();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const BRREG_API_BASE = "https://data.brreg.no/enhetsregisteret/api/enheter";
const BRREG_ROLES_OPEN = "https://data.brreg.no/enhetsregisteret/api/roller/enhet";
const BRREG_ROLES_AUTH = "https://data.brreg.no/enhetsregisteret/autorisert-api/enheter";

function buildFetchOptions(authHeader: string | null) {
  if (!authHeader) return {};
  const supabasePrefix = /^Bearer\s+/i;
  // Skip common Supabase JWTs that start with "Bearer ey"
  if (supabasePrefix.test(authHeader) && authHeader.slice(7, 9) === 'ey') {
    return {};
  }
  return { headers: { 'Authorization': authHeader } } as RequestInit;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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
    log("Auth header present:", !!authHeader);
    
    // Check if the query looks like an organization number (9 digits)
    const isOrgNumber = /^\d{9}$/.test(query);
    let cacheKey: string[] | undefined;
    if (isOrgNumber) {
      cacheKey = ['brreg_cache', query];
      const cached = await kv.get<{ timestamp: number; data: unknown }>(cacheKey);
      if (cached.value && Date.now() - cached.value.timestamp < CACHE_TTL_MS) {
        log(`[BRREG] Returning cached data for ${query}`);
        return new Response(JSON.stringify(cached.value.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    if (!isOrgNumber) {
      // For name searches, proceed as before
      const searchParams = new URLSearchParams({
        navn: query,
        size: '10',
      });
      const searchUrl = `${BRREG_API_BASE}?${searchParams.toString()}`;
      log("Searching by name:", searchUrl);
      
      const fetchOptions = buildFetchOptions(authHeader);
      const response = await fetch(searchUrl, fetchOptions);

      if (!response.ok) {
        console.error(`Error searching for company by name. Status: ${response.status}`);
        const handled = handleBrregError(response.status, corsHeaders);
        if (handled) return handled;

        return new Response(
          JSON.stringify({
            error: 'Error from Brønnøysund API',
            status: response.status,
            message: 'Unexpected response from Brønnøysund API. Try again later or contact support.'
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const data = await response.json();
      log("Search data received:", JSON.stringify(data).substring(0, 200) + "...");
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If it's an org number, fetch detailed information
    log(`Fetching detailed information for org number: ${query}`);
    
    const fetchOptions = buildFetchOptions(authHeader);
    
    // Fetch the basic organization information
    const baseUrl = `${BRREG_API_BASE}/${query}`;
    const baseResponse = await fetch(baseUrl, fetchOptions);

    // Handle various error responses
    if (!baseResponse.ok) {
      console.error(`Error fetching company data. Status: ${baseResponse.status}`);

      const handled = handleBrregError(baseResponse.status, corsHeaders, query);
      if (handled) return handled;

      return new Response(
        JSON.stringify({
          error: 'Error from Brønnøysund API',
          status: baseResponse.status,
          message: 'Unexpected response from Brønnøysund API. Try again later or contact support.'
        }),
        { status: baseResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const baseData = await baseResponse.json();

    /** --- REGNSKAP HENTING OG MAPPING --- */
    let equityCapital = null;
    let shareCapital = null;

    try {
      // 1. Prøv åpent regnskap-endepunkt
      let regnskapUrl = `https://data.brreg.no/enhetsregisteret/api/enheter/${query}/regnskap`;
      let regnskapRes = await fetch(regnskapUrl, fetchOptions);
      let regnskapData = null;

      if (regnskapRes.status === 404 && !!authHeader) {
        // 2. Fallback til autorisert endepunkt
        regnskapUrl = `https://data.brreg.no/enhetsregisteret/autorisert-api/enheter/${query}/regnskap`;
        regnskapRes = await fetch(regnskapUrl, fetchOptions);
      }

      if (regnskapRes.ok) {
        regnskapData = await regnskapRes.json();
        // Litt forskjellig struktur – bruk alltid første år (siste regnskap)
        const latest = Array.isArray(regnskapData?.regnskap) && regnskapData.regnskap.length > 0
          ? regnskapData.regnskap[0] : null;
        if (latest) {
          // Aksjekapital
          if (!isNaN(Number(latest.aksjekapital))) {
            shareCapital = Number(latest.aksjekapital);
          } else if (!isNaN(Number(latest.aksjekapitalNOK))) {
            shareCapital = Number(latest.aksjekapitalNOK);
          }
          // Egenkapital
          if (!isNaN(Number(latest.innskuddskapital))) {
            equityCapital = Number(latest.innskuddskapital);
          } else if (!isNaN(Number(latest.egenkapital))) {
            equityCapital = Number(latest.egenkapital);
          }
          // Fallback
          if ((equityCapital == null || isNaN(equityCapital)) && (shareCapital != null && !isNaN(shareCapital))) {
            equityCapital = shareCapital;
          }
          // Sjekk for ugyldige verdier
          if (equityCapital != null && isNaN(equityCapital)) equityCapital = null;
          if (shareCapital != null && isNaN(shareCapital)) shareCapital = null;
        }
      }
    } catch (e) {
      console.error(`[brreg] error while fetching regnskap:`, e);
    }

    // --------- ROLLER: Først mot åpent endepunkt ---------
    let rolesData = { roller: [] };
    let roller = [];
    let roleEndpointTried = "";
    let roleResponseStatus = 0;

    // 1: Åpent endepunkt
    const openRolesUrl = `${BRREG_ROLES_OPEN}/${query}`;
    log("ROLES URL (open API):", openRolesUrl);
    
    try {
      const rolesOpenResp = await fetch(openRolesUrl, fetchOptions);
      roleEndpointTried = "open";
      roleResponseStatus = rolesOpenResp.status;
      
      log(`[BRREG] Roller (open API) status: ${rolesOpenResp.status}`);
      
      if (rolesOpenResp.ok) {
        const openData = await rolesOpenResp.json();
        rolesData = openData;
        roller = openData.roller || [];
        log(`[BRREG] Roller (open api) hentet for ${query}: #roller=${roller.length}`);
      } else if (rolesOpenResp.status === 404) {
        log(`[BRREG] Roller (open API) 404 for ${query}, trying authorized endpoint...`);
        
        // 2: Fallback til autorisert dersom 404 og evt. Auth header finnes
        const authRolesUrl = `${BRREG_ROLES_AUTH}/${query}/roller`;
        log("ROLES URL (authorized API):", authRolesUrl);
        
        const rolesAuthResp = await fetch(authRolesUrl, fetchOptions);
        roleEndpointTried = "auth";
        roleResponseStatus = rolesAuthResp.status;
        
        log(`[BRREG] Roller (auth API) status: ${rolesAuthResp.status}`);
        
        if (rolesAuthResp.ok) {
          const authData = await rolesAuthResp.json();
          rolesData = authData;
          roller = authData.roller || [];
          log(`[BRREG] Roller (autorisert api) hentet for ${query}: #roller=${roller.length}`);
        } else {
          log(`[BRREG] Roller (autorisert) ${rolesAuthResp.status} for ${query}`);
          rolesData = { roller: [] };
        }
      } else {
        log(`[BRREG] Roller-kall feilet for ${query}: status=${rolesOpenResp.status}`);
        rolesData = { roller: [] };
      }
    } catch (err) {
      console.error(`[BRREG] Roller-kall exception:`, err);
      rolesData = { roller: [] };
    }

    // Ekstra logging for feilsøk
    if (query === "922666997") {
      log("[DEBUG] Rå roller-payload:", JSON.stringify(roller, null, 2));
      if (baseData.kapital) {
        log('KAPITAL', JSON.stringify(baseData.kapital, null, 2));
      } else {
        log('KAPITAL: NOT FOUND in response');
      }
    }

    // — Mapping: CEO, chair, boardMembers —
    const processedRoles = processRolesStrict(roller);
    log("[BRREG] Processed roles:", JSON.stringify(processedRoles));
    
    // Log the found roles for better debugging
    if (processedRoles.ceo || processedRoles.chair || processedRoles.boardMembers.length > 0) {
      log(`[BRREG] Saved CEO: ${processedRoles.ceo?.name || 'None'}, Chair: ${processedRoles.chair?.name || 'None'}, boardRoles: ${processedRoles.boardMembers.length}`);
    } else {
      log(`[BRREG] No roles found for ${query}`);
    }
    
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

    // Extract homepage from hjemmeside field directly (may be string or object)
    let homepage = baseData.hjemmeside;
    if (homepage && typeof homepage === "object" && homepage.adresseUrl) {
      homepage = homepage.adresseUrl;
    }

    // Extract capital fields from kapital object directly
    if (baseData.kapital) {
      // Aksjekapital → shareCapital
      if (
        baseData.kapital.aksjekapital !== undefined &&
        !isNaN(Number(baseData.kapital.aksjekapital))
      ) {
        shareCapital = Number(baseData.kapital.aksjekapital);
      } else if (
        baseData.kapital.aksjekapitalNOK !== undefined &&
        !isNaN(Number(baseData.kapital.aksjekapitalNOK))
      ) {
        shareCapital = Number(baseData.kapital.aksjekapitalNOK);
      }

      // Innskuddskapital → equityCapital
      if (
        baseData.kapital.innskuddskapital !== undefined &&
        !isNaN(Number(baseData.kapital.innskuddskapital))
      ) {
        equityCapital = Number(baseData.kapital.innskuddskapital);
      } else if (shareCapital !== null) {
        // fallback: bruk share om equity mangler
        equityCapital = shareCapital;
      }
    }

    // Logg råverdier for sanity check
    log("[BRREG] Rå kapital-felter:", {
      aksjekapital: baseData.kapital?.aksjekapital,
      aksjekapitalNOK: baseData.kapital?.aksjekapitalNOK,
      innskuddskapital: baseData.kapital?.innskuddskapital,
      sum_eiendeler: baseData.kapital?.sum_eiendeler,
      sum_egenkapital: baseData.kapital?.sum_egenkapital,
    });

    // Logg den faktiske mappingen ut
    log("Saved capital:", { equity: equityCapital, share: shareCapital });

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

    log("Returning enhanced data object");
    if (isOrgNumber && cacheKey) {
      try {
        await kv.set(cacheKey, {
          timestamp: Date.now(),
          data: enhancedData
        });
      } catch (err) {
        console.error('Cache store error:', err);
      }
    }
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
      ?? ((ceoRole.person?.fornavn && ceoRole.person?.etternavn) ? `${ceoRole.person.fornavn} ${ceoRole.person.etternavn}` : null);
    if (personName) {
      result.ceo = {
        name: personName,
        fromDate: (ceoRole.fraTraadtTiltredtDato || ceoRole.fra) ?? null,
        toDate: (ceoRole.tilTraadtFraTredtDato || ceoRole.til) ?? null,
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
      ?? ((chairRole.person?.fornavn && chairRole.person?.etternavn) ? `${chairRole.person.fornavn} ${chairRole.person.etternavn}` : null);
    if (personName) {
      result.chair = {
        name: personName,
        fromDate: (chairRole.fraTraadtTiltredtDato || chairRole.fra) ?? null,
        toDate: (chairRole.tilTraadtFraTredtDato || chairRole.til) ?? null,
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
        ?? ((r.person?.fornavn && r.person?.etternavn) ? `${r.person.fornavn} ${r.person.etternavn}` : null);
      if (personName) {
        result.boardMembers.push({
          name: personName,
          fromDate: (r.fraTraadtTiltredtDato || r.fra) ?? null,
          toDate: (r.tilTraadtFraTredtDato || r.til) ?? null,
          roleType: "MEMBER",
          description: r.rolleBeskrivelse || ""
        });
      }
    }
  });
  return result;
}
