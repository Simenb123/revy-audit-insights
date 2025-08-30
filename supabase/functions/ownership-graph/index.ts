import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface GraphNode {
  id: string
  type: 'company' | 'person'
  label: string
  orgnr?: string
  data: {
    name: string
    orgnr?: string
    entity_type?: string
    country_code?: string
    birth_year?: number
    total_shares?: number
  }
}

interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  data: {
    shares: number
    share_class: string
    percentage: number
  }
}

interface GraphResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verifiser JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verifiser bruker
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Hent parametere fra body eller URL
    let params: {
      orgnr: string
      year?: number
      direction?: 'up' | 'down' | 'both'
      depth?: number
    }

    if (req.method === 'POST') {
      params = await req.json()
    } else {
      const url = new URL(req.url)
      params = {
        orgnr: url.searchParams.get('orgnr') || '',
        year: parseInt(url.searchParams.get('year') || new Date().getFullYear().toString()),
        direction: (url.searchParams.get('direction') as 'up' | 'down' | 'both') || 'both',
        depth: parseInt(url.searchParams.get('depth') || '2')
      }
    }

    const { orgnr, year = new Date().getFullYear(), direction = 'both', depth: requestedDepth = 2 } = params
    const depth = Math.min(requestedDepth, 6) // max 6 nivåer

    if (!orgnr) {
      throw new Error('orgnr parameter is required')
    }

    console.log(`Building ownership graph for ${orgnr}, year ${year}, direction ${direction}, depth ${depth}`)

    const nodes = new Map<string, GraphNode>()
    const edges = new Map<string, GraphEdge>()
    const visited = new Set<string>()

    // Hjelpefunksjon for å lage node ID
    const makeNodeId = (type: string, identifier: string) => `${type}:${identifier}`

    // BFS for å bygge graf
    async function buildGraph(
      currentOrgnr: string, 
      currentDepth: number, 
      searchDirection: 'up' | 'down' | 'both'
    ) {
      if (currentDepth > depth || visited.has(currentOrgnr)) {
        return
      }
      
      visited.add(currentOrgnr)

      // Hent selskapsinfo
      const { data: company } = await supabase
        .from('share_companies')
        .select('*')
        .eq('orgnr', currentOrgnr)
        .eq('year', year)
        .is('user_id', null)
        .single()

      if (company) {
        const nodeId = makeNodeId('company', currentOrgnr)
        nodes.set(nodeId, {
          id: nodeId,
          type: 'company',
          label: company.name,
          orgnr: company.orgnr,
          data: {
            name: company.name,
            orgnr: company.orgnr,
            total_shares: company.total_shares
          }
        })
      }

      // Søk oppover (hvem eier dette selskapet)
      if (searchDirection === 'up' || searchDirection === 'both') {
        const { data: upstreamHoldings } = await supabase
          .from('share_holdings')
          .select(`
            shares,
            share_class,
            share_entities (
              id,
              entity_type,
              name,
              country_code,
              birth_year,
              orgnr
            )
          `)
          .eq('company_orgnr', currentOrgnr)
          .eq('year', year)
          .is('user_id', null)

        for (const holding of upstreamHoldings || []) {
          const entity = holding.share_entities
          if (!entity) continue

          const entityId = entity.entity_type === 'company' && entity.orgnr 
            ? makeNodeId('company', entity.orgnr)
            : makeNodeId('person', entity.name)

          // Legg til node
          nodes.set(entityId, {
            id: entityId,
            type: entity.entity_type as 'company' | 'person',
            label: entity.name,
            orgnr: entity.orgnr || undefined,
            data: {
              name: entity.name,
              orgnr: entity.orgnr || undefined,
              entity_type: entity.entity_type,
              country_code: entity.country_code || undefined,
              birth_year: entity.birth_year || undefined
            }
          })

          // Legg til edge (eier -> selskap)
          const edgeId = `${entityId}->${makeNodeId('company', currentOrgnr)}`
          const percentage = company ? (holding.shares / company.total_shares) * 100 : 0
          
          edges.set(edgeId, {
            id: edgeId,
            source: entityId,
            target: makeNodeId('company', currentOrgnr),
            label: `${holding.shares.toLocaleString()} (${percentage.toFixed(1)}%)`,
            data: {
              shares: holding.shares,
              share_class: holding.share_class,
              percentage
            }
          })

          // Rekursivt søk hvis dette er et selskap
          if (entity.entity_type === 'company' && entity.orgnr && currentDepth < depth) {
            await buildGraph(entity.orgnr, currentDepth + 1, 'up')
          }
        }
      }

      // Søk nedover (hva eier dette selskapet)
      if (searchDirection === 'down' || searchDirection === 'both') {
        const { data: downstreamHoldings } = await supabase
          .from('share_holdings')
          .select(`
            company_orgnr,
            shares,
            share_class,
            share_entities!inner (
              orgnr
            )
          `)
          .eq('share_entities.orgnr', currentOrgnr)
          .eq('year', year)
          .is('user_id', null)

        const ownedCompanies = new Set<string>()
        
        for (const holding of downstreamHoldings || []) {
          ownedCompanies.add(holding.company_orgnr)
        }

        // Hent info om eide selskaper
        if (ownedCompanies.size > 0) {
          const { data: ownedCompaniesData } = await supabase
            .from('share_companies')
            .select('*')
            .in('orgnr', Array.from(ownedCompanies))
            .eq('year', year)
            .is('user_id', null)

          for (const ownedCompany of ownedCompaniesData || []) {
            const ownedNodeId = makeNodeId('company', ownedCompany.orgnr)
            
            // Legg til node
            nodes.set(ownedNodeId, {
              id: ownedNodeId,
              type: 'company',
              label: ownedCompany.name,
              orgnr: ownedCompany.orgnr,
              data: {
                name: ownedCompany.name,
                orgnr: ownedCompany.orgnr,
                total_shares: ownedCompany.total_shares
              }
            })

            // Finn tilhørende holding
            const relevantHolding = downstreamHoldings?.find(h => h.company_orgnr === ownedCompany.orgnr)
            
            if (relevantHolding) {
              const edgeId = `${makeNodeId('company', currentOrgnr)}->${ownedNodeId}`
              const percentage = (relevantHolding.shares / ownedCompany.total_shares) * 100
              
              edges.set(edgeId, {
                id: edgeId,
                source: makeNodeId('company', currentOrgnr),
                target: ownedNodeId,
                label: `${relevantHolding.shares.toLocaleString()} (${percentage.toFixed(1)}%)`,
                data: {
                  shares: relevantHolding.shares,
                  share_class: relevantHolding.share_class,
                  percentage
                }
              })

              // Rekursivt søk
              if (currentDepth < depth) {
                await buildGraph(ownedCompany.orgnr, currentDepth + 1, 'down')
              }
            }
          }
        }
      }
    }

    // Start BFS fra rot-selskapet
    await buildGraph(orgnr, 1, direction as 'up' | 'down' | 'both')

    const result: GraphResponse = {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    }

    console.log(`Graph built: ${result.nodes.length} nodes, ${result.edges.length} edges`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Ownership graph error:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})