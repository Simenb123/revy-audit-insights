import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Shield, 
  Database, 
  Mail, 
  Users, 
  FileText, 
  Activity,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SystemSettings = () => {
  const { toast } = useToast();
  
  // Mock state for system settings
  const [settings, setSettings] = useState({
    // Security settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    passwordMinLength: 8,
    
    // Email settings
    emailNotifications: true,
    auditEmailAlerts: true,
    systemMaintenanceNotifications: true,
    
    // Data retention
    auditLogRetentionDays: 365,
    autoArchiveAfterDays: 90,
    
    // System limits
    maxUsersPerFirm: 50,
    maxClientsPerUser: 100,
    apiRateLimit: 1000,
    
    // Features
    aiAssistantEnabled: true,
    advancedAnalyticsEnabled: true,
    bulkOperationsEnabled: true
  });

  const handleSave = () => {
    // In a real implementation, this would save to the database
    toast({
      title: "Innstillinger lagret",
      description: "Systeminnstillingene er oppdatert.",
    });
  };

  const handleReset = () => {
    toast({
      title: "Innstillinger tilbakestilt",
      description: "Alle innstillinger er tilbakestilt til standardverdier.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Systeminnstillinger</h1>
          <p className="text-muted-foreground">
            Konfigurer systemparametere og innstillinger
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Tilbakestill
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Lagre endringer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="security">Sikkerhet</TabsTrigger>
          <TabsTrigger value="email">E-post</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="limits">Begrensninger</TabsTrigger>
          <TabsTrigger value="features">Funksjoner</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sikkerhetsinnstillinger
              </CardTitle>
              <CardDescription>
                Konfigurer sikkerhet og autentiseringsregler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Økt-timeout (minutter)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Tid før automatisk utlogging ved inaktivitet
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Maks påloggingsforsøk</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Antall forsøk før konto låses
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum passordlengde</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireTwoFactor">Krev tofaktorautentisering</Label>
                    <p className="text-sm text-muted-foreground">
                      Obligatorisk 2FA for alle brukere
                    </p>
                  </div>
                  <Switch
                    id="requireTwoFactor"
                    checked={settings.requireTwoFactor}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireTwoFactor: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-postvarsler
              </CardTitle>
              <CardDescription>
                Konfigurer e-postvarsler og notifikasjoner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">E-postvarsler aktivert</Label>
                    <p className="text-sm text-muted-foreground">
                      Generelle systemvarsler via e-post
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auditEmailAlerts">Audit-varsler</Label>
                    <p className="text-sm text-muted-foreground">
                      Varsler om kritiske revisjonsaktiviteter
                    </p>
                  </div>
                  <Switch
                    id="auditEmailAlerts"
                    checked={settings.auditEmailAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auditEmailAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemMaintenanceNotifications">Vedlikehold</Label>
                    <p className="text-sm text-muted-foreground">
                      Varsler om systemvedlikehold og oppgraderinger
                    </p>
                  </div>
                  <Switch
                    id="systemMaintenanceNotifications"
                    checked={settings.systemMaintenanceNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemMaintenanceNotifications: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Datalagring og arkivering
              </CardTitle>
              <CardDescription>
                Konfigurer dataoppbevaring og automatisk arkivering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="auditLogRetentionDays">Audit-logg oppbevaring (dager)</Label>
                  <Input
                    id="auditLogRetentionDays"
                    type="number"
                    value={settings.auditLogRetentionDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, auditLogRetentionDays: parseInt(e.target.value) }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Hvor lenge audit-logger skal oppbevares
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoArchiveAfterDays">Auto-arkivering (dager)</Label>
                  <Input
                    id="autoArchiveAfterDays"
                    type="number"
                    value={settings.autoArchiveAfterDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoArchiveAfterDays: parseInt(e.target.value) }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Når gamle data skal arkiveres automatisk
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Viktig om dataoppbevaring</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Endringer i oppbevaringsregler påvirker eksisterende data. Vær forsiktig med å redusere oppbevaringstid.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Systembegrensninger
              </CardTitle>
              <CardDescription>
                Sett grenser for bruk og ressurser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxUsersPerFirm">Maks brukere per firma</Label>
                  <Input
                    id="maxUsersPerFirm"
                    type="number"
                    value={settings.maxUsersPerFirm}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxUsersPerFirm: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxClientsPerUser">Maks klienter per bruker</Label>
                  <Input
                    id="maxClientsPerUser"
                    type="number"
                    value={settings.maxClientsPerUser}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxClientsPerUser: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">API rate limit (per time)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={settings.apiRateLimit}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiRateLimit: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Badge variant="secondary">Gjeldende</Badge>
                      <div className="text-2xl font-bold mt-2">127</div>
                      <p className="text-sm text-muted-foreground">Aktive brukere</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Badge variant="secondary">Totalt</Badge>
                      <div className="text-2xl font-bold mt-2">1,847</div>
                      <p className="text-sm text-muted-foreground">Klienter</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Badge variant="secondary">I dag</Badge>
                      <div className="text-2xl font-bold mt-2">2,341</div>
                      <p className="text-sm text-muted-foreground">API-kall</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Funksjonsinnstillinger
              </CardTitle>
              <CardDescription>
                Aktiver eller deaktiver systemfunksjoner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="aiAssistantEnabled">AI-assistent</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktiverer AI-drevne revisjonsassistenter
                    </p>
                  </div>
                  <Switch
                    id="aiAssistantEnabled"
                    checked={settings.aiAssistantEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, aiAssistantEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="advancedAnalyticsEnabled">Avansert analyse</Label>
                    <p className="text-sm text-muted-foreground">
                      Detaljerte analyser og rapporter
                    </p>
                  </div>
                  <Switch
                    id="advancedAnalyticsEnabled"
                    checked={settings.advancedAnalyticsEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, advancedAnalyticsEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="bulkOperationsEnabled">Bulk-operasjoner</Label>
                    <p className="text-sm text-muted-foreground">
                      Tillater masseoperasjoner på data
                    </p>
                  </div>
                  <Switch
                    id="bulkOperationsEnabled"
                    checked={settings.bulkOperationsEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, bulkOperationsEnabled: checked }))}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Systemstatus</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge variant="default">Tilkoblet</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">E-posttjeneste</span>
                    <Badge variant="default">Aktiv</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI-tjenester</span>
                    <Badge variant="default">Operativ</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backup</span>
                    <Badge variant="secondary">Siste: 2 timer siden</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;