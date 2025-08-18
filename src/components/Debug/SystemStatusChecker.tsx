import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export const SystemStatusChecker: React.FC = () => {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSystemChecks = async () => {
    setIsRunning(true);
    const newChecks: SystemCheck[] = [];

    // Check 1: Database tables
    try {
      const { data, error } = await supabase
        .from('ai_analysis_sessions')
        .select('count', { count: 'exact', head: true });
      
      newChecks.push({
        name: 'AI Analysis Sessions Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Table exists with ${data?.length || 0} rows`,
        details: { error, data }
      });
    } catch (error) {
      newChecks.push({
        name: 'AI Analysis Sessions Table',
        status: 'error',
        message: `Error: ${error}`,
        details: error
      });
    }

    // Check 2: Cache table
    try {
      const { data, error } = await supabase
        .from('ai_analysis_cache')
        .select('count', { count: 'exact', head: true });
      
      newChecks.push({
        name: 'AI Analysis Cache Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Table exists with ${data?.length || 0} rows`,
        details: { error, data }
      });
    } catch (error) {
      newChecks.push({
        name: 'AI Analysis Cache Table',
        status: 'error',
        message: `Error: ${error}`,
        details: error
      });
    }

    // Check 3: Edge function availability
    try {
      const { data, error } = await supabase.functions.invoke('ai-transaction-analysis-v2', {
        body: { test: true }
      });
      
      newChecks.push({
        name: 'AI Transaction Analysis V2 Function',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Function is accessible',
        details: { error, data }
      });
    } catch (error) {
      newChecks.push({
        name: 'AI Transaction Analysis V2 Function',
        status: 'error',
        message: `Error: ${error}`,
        details: error
      });
    }

    // Check 4: Test client data
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name')
        .limit(1);
      
      newChecks.push({
        name: 'Test Client Data',
        status: error ? 'error' : clients?.length ? 'success' : 'warning',
        message: error ? error.message : clients?.length ? `Found ${clients.length} client(s)` : 'No test clients found',
        details: { error, clients }
      });
    } catch (error) {
      newChecks.push({
        name: 'Test Client Data',
        status: 'error',
        message: `Error: ${error}`,
        details: error
      });
    }

    setChecks(newChecks);
    setIsRunning(false);
  };

  useEffect(() => {
    runSystemChecks();
  }, []);

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusVariant = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <Button 
            onClick={runSystemChecks} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm text-muted-foreground">{check.message}</div>
                </div>
              </div>
              <Badge variant={getStatusVariant(check.status) as any}>
                {check.status}
              </Badge>
            </div>
          ))}
          
          {checks.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {isRunning ? 'Running system checks...' : 'No checks run yet'}
            </div>
          )}
          
          {checks.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <strong>Summary:</strong> {checks.filter(c => c.status === 'success').length} passed, {' '}
                {checks.filter(c => c.status === 'error').length} failed, {' '}
                {checks.filter(c => c.status === 'warning').length} warnings
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};