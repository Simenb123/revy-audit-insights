import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SchemaIssue {
  table: string;
  missingColumns: string[];
}

export const validateCriticalTables = async (): Promise<SchemaIssue[]> => {
  const issues: SchemaIssue[] = [];
  
  try {
    // Check if AR/AP balance tables exist and have required columns
    const { data: schemaStatus, error } = await supabase
      .from('schema_status')
      .select('*');
    
    if (error) {
      console.error('Error checking schema status:', error);
      return issues;
    }

    if (!schemaStatus || schemaStatus.length === 0) {
      issues.push({
        table: 'schema_status',
        missingColumns: ['Schema status view not found']
      });
      return issues;
    }

    // Check AR customer balances table
    const arTable = schemaStatus.find(s => s.table_name === 'ar_customer_balances');
    if (arTable) {
      const missingColumns: string[] = [];
      if (!arTable.has_client_id) missingColumns.push('client_id');
      if (!arTable.has_version_id) missingColumns.push('version_id');
      if (!arTable.has_customer_id) missingColumns.push('customer_id');
      if (!arTable.has_saldo) missingColumns.push('saldo');
      
      if (missingColumns.length > 0) {
        issues.push({
          table: 'ar_customer_balances',
          missingColumns
        });
      }
    } else {
      issues.push({
        table: 'ar_customer_balances',
        missingColumns: ['Table not found']
      });
    }

    // Check AP supplier balances table
    const apTable = schemaStatus.find(s => s.table_name === 'ap_supplier_balances');
    if (apTable) {
      const missingColumns: string[] = [];
      if (!apTable.has_client_id) missingColumns.push('client_id');
      if (!apTable.has_version_id) missingColumns.push('version_id');
      if (!apTable.has_saldo) missingColumns.push('saldo');
      
      if (missingColumns.length > 0) {
        issues.push({
          table: 'ap_supplier_balances',
          missingColumns
        });
      }
    } else {
      issues.push({
        table: 'ap_supplier_balances',
        missingColumns: ['Table not found']
      });
    }

  } catch (error) {
    console.error('Error validating schema:', error);
    issues.push({
      table: 'validation_error',
      missingColumns: ['Could not validate schema']
    });
  }
  
  return issues;
};

export const showSchemaIssuesIfAny = async () => {
  const issues = await validateCriticalTables();
  
  if (issues.length > 0) {
    const issueDetails = issues.map(issue => 
      `${issue.table}: ${issue.missingColumns.join(', ')}`
    ).join('; ');
    
    toast.error(
      `Schema issues detected: ${issueDetails}. Please refresh schema cache or contact admin.`,
      {
        duration: 10000,
        action: {
          label: 'Ignore',
          onClick: () => {}
        }
      }
    );
    
    console.warn('Schema validation issues:', issues);
    return true;
  }
  
  return false;
};