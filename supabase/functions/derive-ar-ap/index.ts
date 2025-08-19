import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionRow {
  id: string
  client_id: string
  upload_batch_id: string
  transaction_date: string
  voucher_number: string
  description: string
  debit_amount: number
  credit_amount: number
  reference_number: string
  customer_id: string
  supplier_id: string
  document_number: string
  value_date: string
  due_date: string
  cid: string
  currency_code: string
  amount_currency: number
  exchange_rate: number
  vat_code: string
  vat_rate: number
  vat_base: number
  vat_debit: number
  vat_credit: number
  account_number: string
  account_name: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { upload_batch_id } = await req.json()

    if (!upload_batch_id) {
      return new Response(JSON.stringify({ error: 'upload_batch_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Starting AR/AP derivation for upload_batch_id: ${upload_batch_id}`)

    // Fetch all transactions for this upload batch
    const { data: transactions, error: fetchError } = await supabase
      .from('general_ledger_transactions')
      .select('*')
      .eq('upload_batch_id', upload_batch_id)

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch transactions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!transactions || transactions.length === 0) {
      console.log('No transactions found for upload_batch_id:', upload_batch_id)
      return new Response(JSON.stringify({ ok: true, ar: 0, ap: 0, message: 'No transactions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Processing ${transactions.length} transactions`)

    // Separate AR and AP transactions
    const arTransactions: any[] = []
    const apTransactions: any[] = []

    // Get user_id from the first transaction (they should all have the same user)
    const user_id = transactions[0]?.client_id ? 
      (await supabase.from('clients').select('user_id').eq('id', transactions[0].client_id).single()).data?.user_id 
      : null

    if (!user_id) {
      console.error('Could not determine user_id from client_id')
      return new Response(JSON.stringify({ error: 'Could not determine user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    for (const transaction of transactions as TransactionRow[]) {
      // Calculate signed amount (debit - credit)
      const amount = (transaction.debit_amount || 0) - (transaction.credit_amount || 0)

      const baseData = {
        upload_batch_id: transaction.upload_batch_id,
        user_id,
        client_id: transaction.client_id,
        journal_id: null, // Not in current schema
        transaction_id: transaction.voucher_number,
        record_id: transaction.id,
        account_id: transaction.id, // Using transaction id as account reference
        account_number: transaction.account_number,
        account_name: transaction.account_name,
        document_no: transaction.document_number,
        reference_no: transaction.reference_number,
        posting_date: transaction.transaction_date,
        value_date: transaction.value_date,
        due_date: transaction.due_date,
        cid: transaction.cid,
        debit: transaction.debit_amount,
        credit: transaction.credit_amount,
        amount,
        currency: transaction.currency_code,
        amount_currency: transaction.amount_currency,
        exchange_rate: transaction.exchange_rate,
        vat_code: transaction.vat_code,
        vat_rate: transaction.vat_rate,
        vat_base: transaction.vat_base,
        vat_debit: transaction.vat_debit,
        vat_credit: transaction.vat_credit
      }

      // If customer_id exists, add to AR
      if (transaction.customer_id) {
        arTransactions.push({
          ...baseData,
          customer_id: transaction.customer_id,
          customer_name: null // Will be joined later if customer master data exists
        })
      }

      // If supplier_id exists, add to AP
      if (transaction.supplier_id) {
        apTransactions.push({
          ...baseData,
          supplier_id: transaction.supplier_id,
          supplier_name: null // Will be joined later if supplier master data exists
        })
      }
    }

    console.log(`Found ${arTransactions.length} AR transactions and ${apTransactions.length} AP transactions`)

    // Insert AR transactions in batches
    let arCount = 0
    if (arTransactions.length > 0) {
      const batchSize = 1000
      for (let i = 0; i < arTransactions.length; i += batchSize) {
        const batch = arTransactions.slice(i, i + batchSize)
        const { error: arError } = await supabase
          .from('ar_transactions')
          .insert(batch)

        if (arError) {
          console.error('Error inserting AR transactions:', arError)
          return new Response(JSON.stringify({ error: 'Failed to insert AR transactions' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        arCount += batch.length
      }
    }

    // Insert AP transactions in batches
    let apCount = 0
    if (apTransactions.length > 0) {
      const batchSize = 1000
      for (let i = 0; i < apTransactions.length; i += batchSize) {
        const batch = apTransactions.slice(i, i + batchSize)
        const { error: apError } = await supabase
          .from('ap_transactions')
          .insert(batch)

        if (apError) {
          console.error('Error inserting AP transactions:', apError)
          return new Response(JSON.stringify({ error: 'Failed to insert AP transactions' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        apCount += batch.length
      }
    }

    console.log(`Successfully inserted ${arCount} AR and ${apCount} AP transactions`)

    return new Response(JSON.stringify({ 
      ok: true, 
      ar: arCount, 
      ap: apCount,
      total_processed: transactions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in derive-ar-ap function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})