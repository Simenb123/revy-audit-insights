import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  operation: 'export' | 'import'
  data?: any[]
  file_name?: string
  custom_columns?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { operation, data, file_name, custom_columns }: RequestBody = await req.json()

    if (operation === 'export') {
      return await handleExport(supabaseClient, user.id, file_name || 'account_data_export.csv')
    } else if (operation === 'import') {
      return await handleImport(supabaseClient, user.id, data || [], file_name || 'import.csv', custom_columns || [])
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid operation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in account-data-manager:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleExport(supabaseClient: any, userId: string, fileName: string) {
  console.log('Starting export for user:', userId)

  // Create export record
  const { data: exportRecord, error: exportError } = await supabaseClient
    .from('data_import_exports')
    .insert({
      operation_type: 'export',
      file_name: fileName,
      user_id: userId,
      status: 'processing'
    })
    .select()
    .single()

  if (exportError) {
    console.error('Error creating export record:', exportError)
    throw new Error('Failed to create export record')
  }

  try {
    // Fetch all standard accounts with their relationships
    const { data: accounts, error: accountsError } = await supabaseClient
      .from('standard_accounts')
      .select(`
        *,
        standard_account_audit_area_mappings(
          audit_areas(audit_number, name),
          is_primary,
          relevance_score,
          notes
        ),
        account_risk_mappings(
          risk_factors(risk_number, name, risk_level),
          risk_level,
          impact_description,
          mitigation_notes
        ),
        related_party_indicators(*),
        estimate_indicators(*),
        account_custom_attributes(*)
      `)
      .eq('is_active', true)
      .order('standard_number')

    if (accountsError) {
      throw new Error('Failed to fetch accounts data')
    }

    // Transform data for CSV format
    const csvData = accounts.map(account => {
      const auditArea = account.standard_account_audit_area_mappings?.[0]
      const riskMapping = account.account_risk_mappings?.[0]
      const relatedParty = account.related_party_indicators?.[0]
      const estimate = account.estimate_indicators?.[0]

      const row: any = {
        standard_number: account.standard_number,
        standard_name: account.standard_name,
        account_type: account.account_type,
        category: account.category,
        analysis_group: account.analysis_group,
        audit_area_number: auditArea?.audit_areas?.audit_number || '',
        audit_area_name: auditArea?.audit_areas?.name || '',
        audit_area_relevance: auditArea?.relevance_score || '',
        audit_area_notes: auditArea?.notes || '',
        risk_factor_number: riskMapping?.risk_factors?.risk_number || '',
        risk_factor_name: riskMapping?.risk_factors?.name || '',
        risk_level: riskMapping?.risk_level || '',
        risk_impact: riskMapping?.impact_description || '',
        risk_mitigation: riskMapping?.mitigation_notes || '',
        is_related_party: relatedParty?.is_related_party || false,
        related_party_type: relatedParty?.indicator_type || '',
        related_party_description: relatedParty?.description || '',
        is_estimate: estimate?.is_estimate || false,
        estimate_type: estimate?.estimate_type || '',
        estimate_complexity: estimate?.complexity_level || '',
        estimation_method: estimate?.estimation_method || '',
        key_assumptions: estimate?.key_assumptions || '',
        audit_considerations: estimate?.audit_considerations || ''
      }

      // Add custom attributes
      if (account.account_custom_attributes) {
        account.account_custom_attributes.forEach((attr: any) => {
          row[`custom_${attr.attribute_name}`] = attr.attribute_value
        })
      }

      return row
    })

    // Update export record
    await supabaseClient
      .from('data_import_exports')
      .update({
        status: 'completed',
        records_processed: csvData.length,
        records_successful: csvData.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportRecord.id)

    console.log(`Export completed: ${csvData.length} records`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: csvData,
        record_count: csvData.length,
        export_id: exportRecord.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Update export record with error
    await supabaseClient
      .from('data_import_exports')
      .update({
        status: 'failed',
        error_details: { message: error.message }
      })
      .eq('id', exportRecord.id)

    throw error
  }
}

async function handleImport(supabaseClient: any, userId: string, data: any[], fileName: string, customColumns: string[]) {
  console.log('Starting import for user:', userId, 'with', data.length, 'records')

  // Create import record
  const { data: importRecord, error: importError } = await supabaseClient
    .from('data_import_exports')
    .insert({
      operation_type: 'import',
      file_name: fileName,
      file_size: JSON.stringify(data).length,
      user_id: userId,
      status: 'processing',
      records_processed: data.length
    })
    .select()
    .single()

  if (importError) {
    console.error('Error creating import record:', importError)
    throw new Error('Failed to create import record')
  }

  let successCount = 0
  let failureCount = 0
  const errors: any[] = []

  try {
    for (const row of data) {
      try {
        await processImportRow(supabaseClient, row, customColumns)
        successCount++
      } catch (error) {
        failureCount++
        errors.push({
          row: row,
          error: error.message
        })
        console.error('Error processing row:', error, 'Row data:', row)
      }
    }

    // Update import record
    await supabaseClient
      .from('data_import_exports')
      .update({
        status: errors.length === data.length ? 'failed' : 'completed',
        records_successful: successCount,
        records_failed: failureCount,
        error_details: errors.length > 0 ? { errors: errors.slice(0, 10) } : null, // Store max 10 errors
        completed_at: new Date().toISOString()
      })
      .eq('id', importRecord.id)

    console.log(`Import completed: ${successCount} successful, ${failureCount} failed`)

    return new Response(
      JSON.stringify({ 
        success: true,
        records_processed: data.length,
        records_successful: successCount,
        records_failed: failureCount,
        errors: errors.slice(0, 5), // Return first 5 errors
        import_id: importRecord.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    await supabaseClient
      .from('data_import_exports')
      .update({
        status: 'failed',
        error_details: { message: error.message }
      })
      .eq('id', importRecord.id)

    throw error
  }
}

async function processImportRow(supabaseClient: any, row: any, customColumns: string[]) {
  const standardNumber = row.standard_number?.toString()
  
  if (!standardNumber) {
    throw new Error('Missing standard_number')
  }

  // Find the standard account
  const { data: account, error: accountError } = await supabaseClient
    .from('standard_accounts')
    .select('id')
    .eq('standard_number', standardNumber)
    .single()

  if (accountError || !account) {
    throw new Error(`Standard account not found: ${standardNumber}`)
  }

  // Handle audit area mapping
  if (row.audit_area_number) {
    const { data: auditArea } = await supabaseClient
      .from('audit_areas')
      .select('id')
      .eq('audit_number', parseInt(row.audit_area_number))
      .single()

    if (auditArea) {
      await supabaseClient
        .from('standard_account_audit_area_mappings')
        .upsert({
          standard_account_id: account.id,
          audit_area_id: auditArea.id,
          is_primary: true,
          relevance_score: parseFloat(row.audit_area_relevance) || 1.0,
          notes: row.audit_area_notes || null
        }, {
          onConflict: 'standard_account_id,audit_area_id'
        })
    }
  }

  // Handle risk mapping
  if (row.risk_factor_number) {
    const { data: riskFactor } = await supabaseClient
      .from('risk_factors')
      .select('id')
      .eq('risk_number', parseInt(row.risk_factor_number))
      .single()

    if (riskFactor) {
      await supabaseClient
        .from('account_risk_mappings')
        .upsert({
          standard_account_id: account.id,
          risk_factor_id: riskFactor.id,
          risk_level: row.risk_level || 'medium',
          impact_description: row.risk_impact || null,
          mitigation_notes: row.risk_mitigation || null
        }, {
          onConflict: 'standard_account_id,risk_factor_id'
        })
    }
  }

  // Handle related party indicators
  if (row.is_related_party !== undefined) {
    await supabaseClient
      .from('related_party_indicators')
      .upsert({
        standard_account_id: account.id,
        is_related_party: row.is_related_party === true || row.is_related_party === 'true',
        indicator_type: row.related_party_type || null,
        description: row.related_party_description || null
      }, {
        onConflict: 'standard_account_id'
      })
  }

  // Handle estimate indicators
  if (row.is_estimate !== undefined) {
    await supabaseClient
      .from('estimate_indicators')
      .upsert({
        standard_account_id: account.id,
        is_estimate: row.is_estimate === true || row.is_estimate === 'true',
        estimate_type: row.estimate_type || null,
        complexity_level: row.estimate_complexity || 'medium',
        estimation_method: row.estimation_method || null,
        key_assumptions: row.key_assumptions || null,
        audit_considerations: row.audit_considerations || null
      }, {
        onConflict: 'standard_account_id'
      })
  }

  // Handle custom attributes
  for (const customCol of customColumns) {
    const value = row[`custom_${customCol}`]
    if (value !== undefined && value !== null && value !== '') {
      await supabaseClient
        .from('account_custom_attributes')
        .upsert({
          standard_account_id: account.id,
          attribute_name: customCol,
          attribute_value: value.toString(),
          attribute_type: 'text'
        }, {
          onConflict: 'standard_account_id,attribute_name'
        })
    }
  }
}