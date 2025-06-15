
import { supabase } from './supabase.ts';

// Enhanced client context with risk analysis
export async function fetchEnhancedClientContext(clientId: string) {
  try {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        risk_areas(*),
        client_audit_actions(
          name,
          description,
          status,
          phase,
          subject_area,
          risk_level,
          due_date,
          assigned_to,
          progress: (case when status = 'completed' then 100 else 50 end)
        ),
        client_documents(
          type,
          status,
          due_date
        ),
        trial_balances(
          period_end_date,
          closing_balance,
          client_account_id
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client context:', clientError);
      return null;
    }

    return client;
  } catch (error) {
    console.error('Client context fetch error:', error);
    return null;
  }
}
