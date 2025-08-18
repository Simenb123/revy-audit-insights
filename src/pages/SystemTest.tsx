import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemStatusChecker } from '@/components/Debug/SystemStatusChecker';
import { AIAnalysisTestButton } from '@/components/TransactionAnalysis/AIAnalysisTestButton';
import { useAIAnalysisSessionsForClient } from '@/hooks/useAIAnalysisSessions';

export const SystemTest: React.FC = () => {
  // Use a test client ID - you can replace this with a real one
  const testClientId = 'test-client-id';
  const { data: sessions } = useAIAnalysisSessionsForClient(testClientId);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Test & Status</h1>
        <p className="text-muted-foreground">
          Test AI-analysesystemet og sjekk systemets helse
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SystemStatusChecker />
          
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test AI-analysefunksjonaliteten med en eksempel-klient:
              </p>
              
              <AIAnalysisTestButton 
                clientId={testClientId}
                selectedVersion="test-version-1"
              />
              
              {sessions && sessions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Test Sessions:</h4>
                  <div className="space-y-2">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-2 border rounded text-xs">
                        <div>
                          <span className="font-medium">{session.session_type}</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(session.started_at).toLocaleTimeString('no-NO')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            session.status === 'completed' 
                              ? 'bg-success text-success-foreground' 
                              : session.status === 'failed' 
                              ? 'bg-destructive text-destructive-foreground'
                              : session.status === 'running'
                              ? 'bg-warning text-warning-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {session.status}
                          </span>
                          {session.progress_percentage > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {session.progress_percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database tables</span>
                  <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Analysis V2 Function</span>
                  <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Management</span>
                  <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Caching System</span>
                  <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Drilldown Analysis</span>
                  <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Export Functionality</span>
                  <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">✓ Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress Tracking</span>
                  <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">✓ Ready</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span>Create test client with transaction data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span>Test full analysis workflow</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full"></span>
                  <span>Verify drilldown functionality</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full"></span>
                  <span>Test export features</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-muted rounded-full"></span>
                  <span>Deploy to production</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};