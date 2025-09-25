import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BRREGCompany {
  organisasjonsnummer: string
  navn: string
  organisasjonsform?: {
    kode: string
    beskrivelse: string
  }
  hjemmeside?: string
  postadresse?: {
    adresse: string[]
    postnummer: string
    poststed: string
  }
  forretningsadresse?: {
    adresse: string[]
    postnummer: string
    poststed: string
  }
  revisor?: Array<{
    organisasjonsnummer: string
    navn: string
    rolle: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { auditor_org_number, auditor_name } = await req.json()

    if (!auditor_org_number) {
      return new Response(
        JSON.stringify({ error: 'auditor_org_number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create bulk import session
    const { data: session, error: sessionError } = await supabaseClient
      .from('bulk_import_sessions')
      .insert({
        session_type: 'brreg_bulk_discovery',
        auditor_org_number,
        auditor_name,
        started_by: user.id,
        status: 'running'
      })
      .select()
      .single()

    if (sessionError) {
      throw sessionError
    }

    // Search BRREG for companies with this auditor using the roller API
    // This API gives us all the roles (including auditor roles) for a specific organization
    console.log(`Starting bulk discovery search for auditor: ${auditor_org_number}`)
    
    let allCompanies: BRREGCompany[] = []
    let page = 0
    let hasMorePages = true
    
    while (hasMorePages && page < 50) { // Safety limit of 50 pages (5000 records)
      try {
        // Use the roller API to find all entities where this auditor has a role
        const rollerUrl = `https://data.brreg.no/enhetsregisteret/api/roller/person?organisasjonsnummer=${auditor_org_number}&page=${page}&size=100`
        console.log(`Fetching page ${page} from roles API: ${rollerUrl}`)
        
        const rollerResponse = await fetch(rollerUrl)
        if (!rollerResponse.ok) {
          console.log(`Roller API returned ${rollerResponse.status}, trying alternative approach`)
          break
        }
        
        const rollerData = await rollerResponse.json()
        const roller = rollerData._embedded?.roller || []
        
        console.log(`Found ${roller.length} roles on page ${page}`)
        
        // Extract unique organization numbers from roles
        const orgNumbers = new Set<string>()
        for (const rolle of roller) {
          if (rolle.enhet?.organisasjonsnummer) {
            orgNumbers.add(rolle.enhet.organisasjonsnummer)
          }
        }
        
        console.log(`Found ${orgNumbers.size} unique organizations on page ${page}`)
        
        // Fetch detailed company information for each organization
        for (const orgNumber of orgNumbers) {
          try {
            const detailUrl = `https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`
            const detailResponse = await fetch(detailUrl)
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json()
              
              if (detailData.organisasjonsnummer && detailData.navn) {
                allCompanies.push({
                  organisasjonsnummer: detailData.organisasjonsnummer,
                  navn: detailData.navn,
                  organisasjonsform: detailData.organisasjonsform,
                  hjemmeside: detailData.hjemmeside,
                  postadresse: detailData.postadresse,
                  forretningsadresse: detailData.forretningsadresse
                })
              }
            }
          } catch (err) {
            console.log(`Error fetching details for ${orgNumber}:`, err)
          }
        }
        
        // Check if there are more pages
        hasMorePages = roller.length === 100 && rollerData.page?.totalPages > page + 1
        page++
        
      } catch (err) {
        console.log(`Error on page ${page}:`, err)
        break
      }
    }
    
    console.log(`Total companies found across all pages: ${allCompanies.length}`)
    const companies = allCompanies

    console.log(`Found ${companies.length} companies for auditor ${auditor_org_number}`)

    // Get existing clients to compare
    const { data: existingClients } = await supabaseClient
      .from('clients')
      .select('org_number')
      .eq('user_id', user.id)

    const existingOrgNumbers = new Set(existingClients?.map(c => c.org_number) || [])

    // Get existing potential clients
    const { data: existingPotential } = await supabaseClient
      .from('potential_clients')
      .select('org_number')
      .eq('auditor_org_number', auditor_org_number)

    const existingPotentialOrgNumbers = new Set(existingPotential?.map(p => p.org_number) || [])

    let newPotentialClients = 0
    let updatedClients = 0
    const potentialClientsToInsert = []

    for (const company of companies) {
      const orgNumber = company.organisasjonsnummer
      
      // Skip if already exists as client or potential client
      if (existingOrgNumbers.has(orgNumber) || existingPotentialOrgNumbers.has(orgNumber)) {
        continue
      }

      // Prepare potential client data
      const potentialClient = {
        org_number: orgNumber,
        company_name: company.navn,
        auditor_org_number,
        auditor_name: auditor_name || 'Ukjent',
        status: 'potential',
        created_by: user.id,
        brreg_data: {
          organisasjonsform: company.organisasjonsform,
          hjemmeside: company.hjemmeside,
          postadresse: company.postadresse,
          forretningsadresse: company.forretningsadresse,
          revisor: company.revisor
        },
        contact_info: {
          website: company.hjemmeside,
          address: company.forretningsadresse?.adresse?.join(', '),
          postal_code: company.forretningsadresse?.postnummer,
          city: company.forretningsadresse?.poststed
        }
      }

      potentialClientsToInsert.push(potentialClient)
      newPotentialClients++
    }

    // Batch insert potential clients
    if (potentialClientsToInsert.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('potential_clients')
        .insert(potentialClientsToInsert)

      if (insertError) {
        console.error('Error inserting potential clients:', insertError)
        throw insertError
      }
    }

    // Update last_seen_at for existing potential clients that are still in BRREG
    const stillActiveOrgNumbers = companies.map(c => c.organisasjonsnummer)
    if (stillActiveOrgNumbers.length > 0) {
      await supabaseClient
        .from('potential_clients')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('auditor_org_number', auditor_org_number)
        .in('org_number', stillActiveOrgNumbers)
    }

    // Mark potential clients as 'lost' if they're no longer in BRREG
    const { data: allPotentialForAuditor } = await supabaseClient
      .from('potential_clients')
      .select('org_number')
      .eq('auditor_org_number', auditor_org_number)
      .eq('status', 'potential')

    const stillActiveOrgNumbersSet = new Set(stillActiveOrgNumbers)
    const lostClients = allPotentialForAuditor?.filter(p => !stillActiveOrgNumbersSet.has(p.org_number)) || []
    
    let lostCount = 0
    if (lostClients.length > 0) {
      const { error: lostError } = await supabaseClient
        .from('potential_clients')
        .update({ status: 'lost', updated_at: new Date().toISOString() })
        .eq('auditor_org_number', auditor_org_number)
        .in('org_number', lostClients.map(c => c.org_number))

      if (!lostError) {
        lostCount = lostClients.length
      }
    }

    // Complete the session
    await supabaseClient
      .from('bulk_import_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_found: companies.length,
        new_potential_clients: newPotentialClients,
        updated_clients: updatedClients,
        lost_clients: lostCount,
        session_data: {
          companies_processed: companies.length,
          existing_clients_count: existingOrgNumbers.size,
          existing_potential_count: existingPotentialOrgNumbers.size
        }
      })
      .eq('id', session.id)

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        total_found: companies.length,
        new_potential_clients: newPotentialClients,
        updated_clients: updatedClients,
        lost_clients: lostCount,
        message: `Fant ${companies.length} selskaper. ${newPotentialClients} nye potensielle klienter lagt til.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in brreg-bulk-discovery:', error)
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        details: 'Se server logs for mer informasjon'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})