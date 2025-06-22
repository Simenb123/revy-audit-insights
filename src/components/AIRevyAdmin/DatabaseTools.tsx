
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const DatabaseTools = () => {
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [validationProgress, setValidationProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Mock database statistics
  const dbStats = {
    totalTables: 45,
    totalRecords: 125684,
    databaseSize: '2.3 GB',
    lastBackup: '2024-01-20 14:30',
    health: 'excellent'
  };

  const tableStats = [
    { name: 'knowledge_articles', records: 1245, size: '45 MB', health: 'good' },
    { name: 'client_documents', records: 8934, size: '890 MB', health: 'excellent' },
    { name: 'audit_actions', records: 2346, size: '12 MB', health: 'good' },
    { name: 'revy_chat_messages', records: 15678, size: '234 MB', health: 'excellent' },
    { name: 'ai_usage_logs', records: 45234, size: '78 MB', health: 'warning' }
  ];

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          toast.success('Database backup fullført');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setRestoreProgress(0);
    
    // Simulate restore progress
    const interval = setInterval(() => {
      setRestoreProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRestoring(false);
          toast.success('Database gjenopprettet');
          return 100;
        }
        return prev + 15;
      });
    }, 700);
  };

  const handleValidation = async () => {
    setIsValidating(true);
    setValidationProgress(0);
    
    // Simulate validation progress
    const interval = setInterval(() => {
      setValidationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsValidating(false);
          toast.success('Database validering fullført');
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBadge = (health) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    
    return <Badge className={colors[health]}>{health}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Verktøy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Oversikt</TabsTrigger>
              <TabsTrigger value="backup">Backup/Restore</TabsTrigger>
              <TabsTrigger value="maintenance">Vedlikehold</TabsTrigger>
              <TabsTrigger value="monitoring">Overvåking</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <DatabaseOverview stats={dbStats} tableStats={tableStats} getHealthBadge={getHealthBadge} />
            </TabsContent>

            <TabsContent value="backup" className="space-y-4">
              <BackupRestore 
                onBackup={handleBackup}
                onRestore={handleRestore}
                backupProgress={backupProgress}
                restoreProgress={restoreProgress}
                isBackingUp={isBackingUp}
                isRestoring={isRestoring}
              />
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <MaintenanceTools 
                onValidation={handleValidation}
                validationProgress={validationProgress}
                isValidating={isValidating}
              />
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <DatabaseMonitoring />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const DatabaseOverview = ({ stats, tableStats, getHealthBadge }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Database Oversikt</h3>
      
      {/* General Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.totalTables}</div>
            <div className="text-sm text-muted-foreground">Tabeller</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Poster</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.databaseSize}</div>
            <div className="text-sm text-muted-foreground">Størrelse</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold mb-1">
              {getHealthBadge(stats.health)}
            </div>
            <div className="text-sm text-muted-foreground">Helse</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Stats */}
      <div>
        <h4 className="text-md font-semibold mb-3">Største tabeller</h4>
        <div className="space-y-2">
          {tableStats.map((table) => (
            <div key={table.name} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <div className="font-medium">{table.name}</div>
                <div className="text-sm text-muted-foreground">
                  {table.records.toLocaleString()} poster • {table.size}
                </div>
              </div>
              {getHealthBadge(table.health)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BackupRestore = ({ 
  onBackup, 
  onRestore, 
  backupProgress, 
  restoreProgress, 
  isBackingUp, 
  isRestoring 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Backup og Gjenoppretting</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Database Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Backup kan ta flere minutter avhengig av database størrelse.
              </AlertDescription>
            </Alert>
            
            {isBackingUp && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Backup pågår...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} />
              </div>
            )}
            
            <div className="space-y-2">
              <Button 
                onClick={onBackup} 
                disabled={isBackingUp}
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                {isBackingUp ? 'Backup pågår...' : 'Start Backup'}
              </Button>
              
              <Button variant="outline" className="w-full gap-2">
                <Settings className="h-4 w-4" />
                Backup Innstillinger
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Database Gjenoppretting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Gjenoppretting vil overskrive eksisterende data. Vær forsiktig!
              </AlertDescription>
            </Alert>
            
            {isRestoring && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gjenoppretting pågår...</span>
                  <span>{restoreProgress}%</span>
                </div>
                <Progress value={restoreProgress} />
              </div>
            )}
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full gap-2">
                <Upload className="h-4 w-4" />
                Velg Backup Fil
              </Button>
              
              <Button 
                onClick={onRestore} 
                disabled={isRestoring}
                variant="destructive" 
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {isRestoring ? 'Gjenoppretter...' : 'Start Gjenoppretting'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup Historikk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { date: '2024-01-20 14:30', size: '2.3 GB', type: 'Full', status: 'success' },
              { date: '2024-01-19 14:30', size: '2.2 GB', type: 'Full', status: 'success' },
              { date: '2024-01-18 14:30', size: '2.1 GB', type: 'Full', status: 'success' }
            ].map((backup, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{backup.date}</div>
                  <div className="text-sm text-muted-foreground">
                    {backup.type} backup • {backup.size}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vellykket
                  </Badge>
                  <Button size="sm" variant="outline">
                    Last ned
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MaintenanceTools = ({ onValidation, validationProgress, isValidating }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Database Vedlikehold</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Validering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isValidating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Validering pågår...</span>
                  <span>{validationProgress}%</span>
                </div>
                <Progress value={validationProgress} />
              </div>
            )}
            
            <div className="space-y-2">
              <Button 
                onClick={onValidation} 
                disabled={isValidating}
                className="w-full gap-2"
              >
                <Shield className="h-4 w-4" />
                {isValidating ? 'Validerer...' : 'Valider Database'}
              </Button>
              
              <Button variant="outline" className="w-full">
                Sjekk Referanser
              </Button>
              
              <Button variant="outline" className="w-full">
                Analyser Ytelse
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Database Opprydding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Slett Gamle Logger
              </Button>
              
              <Button variant="outline" className="w-full">
                Komprimér Tabeller
              </Button>
              
              <Button variant="outline" className="w-full">
                Optimaliser Indekser
              </Button>
              
              <Button variant="destructive" className="w-full">
                Slett Testdata
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vedlikeholdsplan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">Automatisk backup</div>
                <div className="text-sm text-muted-foreground">Daglig kl. 02:00</div>
              </div>
              <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">Database validering</div>
                <div className="text-sm text-muted-foreground">Ukentlig søndager</div>
              </div>
              <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">Logger opprydding</div>
                <div className="text-sm text-muted-foreground">Månedlig</div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Planlagt</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DatabaseMonitoring = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Database Overvåking</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ytelse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Query tid (avg)</span>
              <Badge variant="outline">45ms</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Aktive tilkoblinger</span>
              <Badge variant="outline">12</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">CPU bruk</span>
              <Badge variant="outline">23%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Minne bruk</span>
              <Badge variant="outline">1.2GB</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Errors and Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feil og Advarsler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Feil (24t)</span>
              <Badge className="bg-red-100 text-red-800">2</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Advarsler (24t)</span>
              <Badge className="bg-yellow-100 text-yellow-800">5</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Slow queries</span>
              <Badge className="bg-orange-100 text-orange-800">3</Badge>
            </div>
            <Button size="sm" variant="outline" className="w-full">
              Vis Feillogg
            </Button>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lagring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Disk bruk</span>
              <Badge variant="outline">2.3GB</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tilgjengelig</span>
              <Badge variant="outline">47.7GB</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Kapasitet</span>
                <span>4.6%</span>
              </div>
              <Progress value={4.6} />
            </div>
            <Button size="sm" variant="outline" className="w-full">
              Disk Analyse
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nylig Aktivitet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { time: '14:32', action: 'Backup fullført', status: 'success' },
              { time: '12:15', action: 'Slow query detektert', status: 'warning' },
              { time: '10:45', action: 'Database validering OK', status: 'success' },
              { time: '09:30', action: 'Ny tilkobling fra 192.168.1.100', status: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{activity.time}</div>
                  <div className="text-sm">{activity.action}</div>
                </div>
                <Badge variant="outline">{activity.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTools;
