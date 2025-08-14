import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  MessageCircle, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Users
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NotificationSettings {
  emailNotifications: {
    analysisComplete: boolean;
    highRiskDetected: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  inAppNotifications: {
    realTimeAlerts: boolean;
    analysisUpdates: boolean;
    systemMaintenance: boolean;
    newFeatures: boolean;
  };
  reportScheduling: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    includeAIInsights: boolean;
    includeTrendAnalysis: boolean;
  };
  alertThresholds: {
    highRiskTransactionPercent: number;
    lowConfidenceScorePercent: number;
    processingTimeThreshold: number;
  };
}

const defaultSettings: NotificationSettings = {
  emailNotifications: {
    analysisComplete: true,
    highRiskDetected: true,
    systemAlerts: true,
    weeklyReports: false,
    monthlyReports: true
  },
  inAppNotifications: {
    realTimeAlerts: true,
    analysisUpdates: true,
    systemMaintenance: true,
    newFeatures: false
  },
  reportScheduling: {
    enabled: false,
    frequency: 'weekly',
    recipients: [],
    includeAIInsights: true,
    includeTrendAnalysis: false
  },
  alertThresholds: {
    highRiskTransactionPercent: 10,
    lowConfidenceScorePercent: 20,
    processingTimeThreshold: 30
  }
};

export function NotificationManagementPanel() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // I praksis ville dette laste innstillinger fra backend
      // const savedSettings = await notificationService.getSettings();
      // setSettings(savedSettings || defaultSettings);
      
      // For demo - bruk default settings
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste varslingsinnstillinger",
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // I praksis ville dette lagre til backend
      // await notificationService.saveSettings(settings);
      
      // Simuler lagring
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasUnsavedChanges(false);
      toast({
        title: "Lagret",
        description: "Varslingsinnstillinger har blitt oppdatert",
      });
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre varslingsinnstillinger",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const addRecipient = () => {
    if (newRecipient && !settings.reportScheduling.recipients.includes(newRecipient)) {
      updateSetting('reportScheduling.recipients', [...settings.reportScheduling.recipients, newRecipient]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    updateSetting('reportScheduling.recipients', 
      settings.reportScheduling.recipients.filter(r => r !== email));
  };

  const testNotification = async (type: 'email' | 'inApp') => {
    try {
      // I praksis ville dette sende en test-varsling
      toast({
        title: "Test varsling sendt",
        description: `Test ${type === 'email' ? 'e-post' : 'app-varsling'} har blitt sendt`,
      });
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke sende test-varsling",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Varslingsadministrasjon</h2>
          <p className="text-muted-foreground">
            Konfigurer hvordan og når du vil motta varsler om analyseresultater
          </p>
        </div>
        <Button onClick={saveSettings} disabled={!hasUnsavedChanges || isSaving}>
          {isSaving ? 'Lagrer...' : 'Lagre innstillinger'}
        </Button>
      </div>

      {hasUnsavedChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Du har ulagrede endringer. Husk å lagre innstillingene.
          </AlertDescription>
        </Alert>
      )}

      {/* E-post varsler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>E-post varsler</span>
          </CardTitle>
          <CardDescription>
            Konfigurer hvilke e-post varsler du vil motta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analyse fullført</Label>
              <div className="text-sm text-muted-foreground">
                Få beskjed når en analyse er ferdig
              </div>
            </div>
            <Switch 
              checked={settings.emailNotifications.analysisComplete}
              onCheckedChange={(checked) => updateSetting('emailNotifications.analysisComplete', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Høy risiko oppdaget</Label>
              <div className="text-sm text-muted-foreground">
                Umiddelbar varsling ved kritiske funn
              </div>
            </div>
            <Switch 
              checked={settings.emailNotifications.highRiskDetected}
              onCheckedChange={(checked) => updateSetting('emailNotifications.highRiskDetected', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System varsler</Label>
              <div className="text-sm text-muted-foreground">
                Tekniske problemer og vedlikehold
              </div>
            </div>
            <Switch 
              checked={settings.emailNotifications.systemAlerts}
              onCheckedChange={(checked) => updateSetting('emailNotifications.systemAlerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ukentlige rapporter</Label>
              <div className="text-sm text-muted-foreground">
                Sammendrag av aktivitet hver uke
              </div>
            </div>
            <Switch 
              checked={settings.emailNotifications.weeklyReports}
              onCheckedChange={(checked) => updateSetting('emailNotifications.weeklyReports', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Månedlige rapporter</Label>
              <div className="text-sm text-muted-foreground">
                Detaljert månedlig analyse
              </div>
            </div>
            <Switch 
              checked={settings.emailNotifications.monthlyReports}
              onCheckedChange={(checked) => updateSetting('emailNotifications.monthlyReports', checked)}
            />
          </div>

          <Separator />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testNotification('email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send test e-post
          </Button>
        </CardContent>
      </Card>

      {/* App varsler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>App-varsler</span>
          </CardTitle>
          <CardDescription>
            Konfigurer varsler som vises i applikasjonen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sanntids varsler</Label>
              <div className="text-sm text-muted-foreground">
                Øyeblikkelige varsler i appen
              </div>
            </div>
            <Switch 
              checked={settings.inAppNotifications.realTimeAlerts}
              onCheckedChange={(checked) => updateSetting('inAppNotifications.realTimeAlerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analyse oppdateringer</Label>
              <div className="text-sm text-muted-foreground">
                Fremdrift og resultater fra analyser
              </div>
            </div>
            <Switch 
              checked={settings.inAppNotifications.analysisUpdates}
              onCheckedChange={(checked) => updateSetting('inAppNotifications.analysisUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System vedlikehold</Label>
              <div className="text-sm text-muted-foreground">
                Planlagt nedetid og oppdateringer
              </div>
            </div>
            <Switch 
              checked={settings.inAppNotifications.systemMaintenance}
              onCheckedChange={(checked) => updateSetting('inAppNotifications.systemMaintenance', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Nye funksjoner</Label>
              <div className="text-sm text-muted-foreground">
                Informasjon om nye features
              </div>
            </div>
            <Switch 
              checked={settings.inAppNotifications.newFeatures}
              onCheckedChange={(checked) => updateSetting('inAppNotifications.newFeatures', checked)}
            />
          </div>

          <Separator />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testNotification('inApp')}
          >
            <Bell className="h-4 w-4 mr-2" />
            Send test app-varsling
          </Button>
        </CardContent>
      </Card>

      {/* Rapport planlegging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Automatiske rapporter</span>
          </CardTitle>
          <CardDescription>
            Sett opp automatisk generering og distribusjon av rapporter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aktiver automatiske rapporter</Label>
              <div className="text-sm text-muted-foreground">
                Send rapporter automatisk til definerte mottakere
              </div>
            </div>
            <Switch 
              checked={settings.reportScheduling.enabled}
              onCheckedChange={(checked) => updateSetting('reportScheduling.enabled', checked)}
            />
          </div>

          {settings.reportScheduling.enabled && (
            <>
              <div className="space-y-2">
                <Label>Frekvens</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={settings.reportScheduling.frequency}
                  onChange={(e) => updateSetting('reportScheduling.frequency', e.target.value)}
                >
                  <option value="daily">Daglig</option>
                  <option value="weekly">Ukentlig</option>
                  <option value="monthly">Månedlig</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Mottakere</Label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="legg til e-post adresse"
                    className="flex-1 p-2 border rounded-md"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  />
                  <Button onClick={addRecipient} size="sm">
                    Legg til
                  </Button>
                </div>
                <div className="space-y-1">
                  {settings.reportScheduling.recipients.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{email}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeRecipient(email)}
                      >
                        Fjern
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Inkluder AI-innsikter</Label>
                  <div className="text-sm text-muted-foreground">
                    Legg ved AI-genererte anbefalinger
                  </div>
                </div>
                <Switch 
                  checked={settings.reportScheduling.includeAIInsights}
                  onCheckedChange={(checked) => updateSetting('reportScheduling.includeAIInsights', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Inkluder trend-analyse</Label>
                  <div className="text-sm text-muted-foreground">
                    Historisk sammenligning og trender
                  </div>
                </div>
                <Switch 
                  checked={settings.reportScheduling.includeTrendAnalysis}
                  onCheckedChange={(checked) => updateSetting('reportScheduling.includeTrendAnalysis', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Varslings-terskler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Varslings-terskler</span>
          </CardTitle>
          <CardDescription>
            Definer når varsler skal utløses basert på analyseparametere
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Høyrisiko transaksjoner (%)</Label>
            <div className="text-sm text-muted-foreground">
              Send varsling når andel høyrisiko transaksjoner overskrider denne prosenten
            </div>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full p-2 border rounded-md"
              value={settings.alertThresholds.highRiskTransactionPercent}
              onChange={(e) => updateSetting('alertThresholds.highRiskTransactionPercent', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Lav konfidens skåre (%)</Label>
            <div className="text-sm text-muted-foreground">
              Varsle når AI-konfidens faller under denne prosenten
            </div>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full p-2 border rounded-md"
              value={settings.alertThresholds.lowConfidenceScorePercent}
              onChange={(e) => updateSetting('alertThresholds.lowConfidenceScorePercent', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Prosesseringstid (sekunder)</Label>
            <div className="text-sm text-muted-foreground">
              Varsle når analyser tar lenger tid enn dette
            </div>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded-md"
              value={settings.alertThresholds.processingTimeThreshold}
              onChange={(e) => updateSetting('alertThresholds.processingTimeThreshold', parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}