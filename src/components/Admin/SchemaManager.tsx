import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const SchemaManager = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: schemaStatus, refetch } = useQuery({
    queryKey: ['schema-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schema_status')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const handleRefreshSchema = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.rpc('refresh_postgrest_schema');
      if (error) throw error;
      
      toast.success('Schema cache refreshed successfully');
      await refetch();
    } catch (error: any) {
      console.error('Error refreshing schema:', error);
      toast.error(`Failed to refresh schema: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSchemaIssues = () => {
    if (!schemaStatus) return [];
    
    const issues: string[] = [];
    schemaStatus.forEach((table: any) => {
      if (table.table_name === 'ar_customer_balances') {
        if (!table.has_client_id) issues.push('ar_customer_balances missing client_id');
        if (!table.has_version_id) issues.push('ar_customer_balances missing version_id');
        if (!table.has_customer_id) issues.push('ar_customer_balances missing customer_id');
        if (!table.has_saldo) issues.push('ar_customer_balances missing saldo');
      }
      if (table.table_name === 'ap_supplier_balances') {
        if (!table.has_client_id) issues.push('ap_supplier_balances missing client_id');
        if (!table.has_version_id) issues.push('ap_supplier_balances missing version_id');
        if (!table.has_supplier_id) issues.push('ap_supplier_balances missing supplier_id');
        if (!table.has_saldo) issues.push('ap_supplier_balances missing saldo');
      }
    });
    
    return issues;
  };

  const schemaIssues = getSchemaIssues();
  const hasIssues = schemaIssues.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Schema Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Schema Status</span>
          <div className="flex items-center gap-2">
            {hasIssues ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <span className="text-sm text-muted-foreground">
              {hasIssues ? `${schemaIssues.length} issues` : 'Healthy'}
            </span>
          </div>
        </div>

        {hasIssues && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm font-medium text-destructive mb-2">Schema Issues Detected:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {schemaIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={handleRefreshSchema}
          disabled={isRefreshing}
          className="w-full"
          variant={hasIssues ? "default" : "outline"}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Schema Cache
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Last checked: {schemaStatus?.[0]?.checked_at ? new Date(schemaStatus[0].checked_at).toLocaleString() : 'Never'}
        </p>
      </CardContent>
    </Card>
  );
};

export default SchemaManager;