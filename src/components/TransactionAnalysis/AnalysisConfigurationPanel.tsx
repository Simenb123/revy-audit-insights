import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Download, Upload, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { analysisConfigurationService, AnalysisConfiguration } from '@/services/analysisConfigurationService';

interface AnalysisConfigurationPanelProps {
  currentConfig?: AnalysisConfiguration;
  onConfigurationChange?: (config: AnalysisConfiguration) => void;
}

export function AnalysisConfigurationPanel({ 
  currentConfig, 
  onConfigurationChange 
}: AnalysisConfigurationPanelProps) {
  const [selectedConfigId, setSelectedConfigId] = useState<string>(currentConfig?.id || 'comprehensive');
  const [activeConfig, setActiveConfig] = useState<AnalysisConfiguration>(
    currentConfig || analysisConfigurationService.getConfiguration('comprehensive')!
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const availableConfigs = analysisConfigurationService.getAvailableConfigurations();

  const handleConfigurationSelect = (configId: string) => {
    const config = analysisConfigurationService.getConfiguration(configId);
    if (config) {
      setSelectedConfigId(configId);
      setActiveConfig(config);
      setValidationErrors([]);
      onConfigurationChange?.(config);
    }
  };

  const updateControlTestConfig = (field: string, value: any) => {
    const updatedConfig = {
      ...activeConfig,
      controlTests: {
        ...activeConfig.controlTests,
        [field]: value
      }
    };
    setActiveConfig(updatedConfig);
    validateConfiguration(updatedConfig);
  };

  const updateRiskScoringConfig = (field: string, value: any) => {
    const updatedConfig = {
      ...activeConfig,
      riskScoring: {
        ...activeConfig.riskScoring,
        [field]: value
      }
    };
    setActiveConfig(updatedConfig);
    validateConfiguration(updatedConfig);
  };

  const updateAIAnalysisConfig = (field: string, value: any) => {
    const updatedConfig = {
      ...activeConfig,
      aiAnalysis: {
        ...activeConfig.aiAnalysis,
        [field]: value
      }
    };
    setActiveConfig(updatedConfig);
    validateConfiguration(updatedConfig);
  };

  const updateReportingConfig = (field: string, value: any) => {
    const updatedConfig = {
      ...activeConfig,
      reporting: {
        ...activeConfig.reporting,
        [field]: value
      }
    };
    setActiveConfig(updatedConfig);
    validateConfiguration(updatedConfig);
  };

  const validateConfiguration = (config: AnalysisConfiguration) => {
    const validation = analysisConfigurationService.validateConfiguration(config);
    setValidationErrors(validation.errors);
  };

  const handleSaveConfiguration = () => {
    const validation = analysisConfigurationService.validateConfiguration(activeConfig);
    if (validation.valid) {
      onConfigurationChange?.(activeConfig);
      // In a real app, this would save to backend
      console.log('Configuration saved:', activeConfig);
    } else {
      setValidationErrors(validation.errors);
    }
  };

  const handleExportConfiguration = () => {
    const configJson = analysisConfigurationService.exportConfiguration(activeConfig);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConfig.name.replace(/[^a-zA-Z0-9]/g, '_')}_config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const configJson = e.target?.result as string;
          const importedConfig = analysisConfigurationService.importConfiguration(configJson);
          setActiveConfig(importedConfig);
          setValidationErrors([]);
        } catch (error) {
          setValidationErrors([error instanceof Error ? error.message : 'Import failed']);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Analysekonfigurasjon
        </CardTitle>
        <CardDescription>
          Tilpass analyse-parametere og innstillinger for optimale resultater
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Selection */}
        <div className="space-y-3">
          <Label>Velg forhåndsdefinert konfigurasjon</Label>
          <Select value={selectedConfigId} onValueChange={handleConfigurationSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Velg konfigurasjon" />
            </SelectTrigger>
            <SelectContent>
              {availableConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{config.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {config.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Configuration Details */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">{activeConfig.name}</h4>
          <p className="text-sm text-muted-foreground mb-3">{activeConfig.description}</p>
          <div className="text-xs space-y-1">
            <div>Kontrolltester: {activeConfig.controlTests.enabledTests.length} aktivert</div>
            <div>Risikofaktorer: {activeConfig.riskScoring.enabledFactors.length} aktivert</div>
            <div>AI-analyse: {activeConfig.aiAnalysis.enabled ? 'Aktivert' : 'Deaktivert'}</div>
          </div>
        </div>

        {/* Detailed Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="controls">Kontrolltester</TabsTrigger>
            <TabsTrigger value="risk">Risikoskåring</TabsTrigger>
            <TabsTrigger value="ai">AI-analyse</TabsTrigger>
            <TabsTrigger value="reporting">Rapportering</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Kontrolltester</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {activeConfig.controlTests.enabledTests.map((test) => (
                      <Badge key={test} variant="secondary" className="text-xs">
                        {test.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Toleranse: {(activeConfig.controlTests.balanceTolerancePercent * 100).toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Risikoskåring</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <div>Faktorer: {activeConfig.riskScoring.enabledFactors.length}</div>
                    <div>Høy risiko: ≥{activeConfig.riskScoring.thresholds.highRisk} poeng</div>
                    <div>Medium risiko: ≥{activeConfig.riskScoring.thresholds.mediumRisk} poeng</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">AI-analyse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={activeConfig.aiAnalysis.enabled ? 'default' : 'secondary'}>
                      {activeConfig.aiAnalysis.enabled ? 'Aktivert' : 'Deaktivert'}
                    </Badge>
                  </div>
                  {activeConfig.aiAnalysis.enabled && (
                    <div className="text-sm text-muted-foreground">
                      <div>Modell: {activeConfig.aiAnalysis.model}</div>
                      <div>Max transaksjoner: {activeConfig.aiAnalysis.maxTransactions}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rapportering</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <div>Standard mal: {activeConfig.reporting.defaultTemplate}</div>
                    <div>Lagringstid: {activeConfig.reporting.retentionDays} dager</div>
                    <div>Auto-generering: {activeConfig.reporting.autoGenerateOnComplete ? 'Ja' : 'Nei'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Balansetoleranse (%)</Label>
                <Slider
                  value={[activeConfig.controlTests.balanceTolerancePercent * 100]}
                  onValueChange={([value]) => updateControlTestConfig('balanceTolerancePercent', value / 100)}
                  max={10}
                  min={0}
                  step={0.01}
                />
                <div className="text-xs text-muted-foreground">
                  Nåværende: {(activeConfig.controlTests.balanceTolerancePercent * 100).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-3">
                <Label>Duplikatbeløp-terskel (%)</Label>
                <Slider
                  value={[activeConfig.controlTests.duplicateAmountThreshold * 100]}
                  onValueChange={([value]) => updateControlTestConfig('duplicateAmountThreshold', value / 100)}
                  max={10}
                  min={0}
                  step={0.01}
                />
                <div className="text-xs text-muted-foreground">
                  Nåværende: {(activeConfig.controlTests.duplicateAmountThreshold * 100).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-3">
                <Label>Duplikatdato-område (dager)</Label>
                <Slider
                  value={[activeConfig.controlTests.duplicateDateRangeDays]}
                  onValueChange={([value]) => updateControlTestConfig('duplicateDateRangeDays', value)}
                  max={365}
                  min={1}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  Nåværende: {activeConfig.controlTests.duplicateDateRangeDays} dager
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Helgepostering sjekk</Label>
                  <Switch
                    checked={activeConfig.controlTests.weekendPostingEnabled}
                    onCheckedChange={(checked) => updateControlTestConfig('weekendPostingEnabled', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Høy risiko-terskel</Label>
                <Slider
                  value={[activeConfig.riskScoring.thresholds.highRisk]}
                  onValueChange={([value]) => updateRiskScoringConfig('thresholds', {
                    ...activeConfig.riskScoring.thresholds,
                    highRisk: value
                  })}
                  max={20}
                  min={1}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  Nåværende: {activeConfig.riskScoring.thresholds.highRisk} poeng
                </div>
              </div>

              <div className="space-y-3">
                <Label>Medium risiko-terskel</Label>
                <Slider
                  value={[activeConfig.riskScoring.thresholds.mediumRisk]}
                  onValueChange={([value]) => updateRiskScoringConfig('thresholds', {
                    ...activeConfig.riskScoring.thresholds,
                    mediumRisk: value
                  })}
                  max={15}
                  min={1}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  Nåværende: {activeConfig.riskScoring.thresholds.mediumRisk} poeng
                </div>
              </div>

              <div className="space-y-3">
                <Label>Timing-vekt</Label>
                <Slider
                  value={[activeConfig.riskScoring.weights.timing]}
                  onValueChange={([value]) => updateRiskScoringConfig('weights', {
                    ...activeConfig.riskScoring.weights,
                    timing: value
                  })}
                  max={3}
                  min={0.1}
                  step={0.1}
                />
                <div className="text-xs text-muted-foreground">
                  Nåværende: {activeConfig.riskScoring.weights.timing.toFixed(1)}x
                </div>
              </div>

              <div className="space-y-3">
                <Label>Beløp-vekt</Label>
                <Slider
                  value={[activeConfig.riskScoring.weights.amount]}
                  onValueChange={([value]) => updateRiskScoringConfig('weights', {
                    ...activeConfig.riskScoring.weights,
                    amount: value
                  })}
                  max={3}
                  min={0.1}
                  step={0.1}
                />
                <div className="text-xs text-muted-foreground">
                  Nåværende: {activeConfig.riskScoring.weights.amount.toFixed(1)}x
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Aktiver AI-analyse</Label>
                <Switch
                  checked={activeConfig.aiAnalysis.enabled}
                  onCheckedChange={(checked) => updateAIAnalysisConfig('enabled', checked)}
                />
              </div>

              {activeConfig.aiAnalysis.enabled && (
                <>
                  <div className="space-y-3">
                    <Label>AI-modell</Label>
                    <Select
                      value={activeConfig.aiAnalysis.model}
                      onValueChange={(value) => updateAIAnalysisConfig('model', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Anbefalt)</SelectItem>
                        <SelectItem value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini (Raskere)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Billigere)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Maksimum transaksjoner</Label>
                    <Slider
                      value={[activeConfig.aiAnalysis.maxTransactions]}
                      onValueChange={([value]) => updateAIAnalysisConfig('maxTransactions', value)}
                      max={5000}
                      min={100}
                      step={100}
                    />
                    <div className="text-xs text-muted-foreground">
                      Nåværende: {activeConfig.aiAnalysis.maxTransactions} transaksjoner
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Konfidensterskel</Label>
                    <Slider
                      value={[activeConfig.aiAnalysis.confidenceThreshold]}
                      onValueChange={([value]) => updateAIAnalysisConfig('confidenceThreshold', value)}
                      max={1}
                      min={0.1}
                      step={0.1}
                    />
                    <div className="text-xs text-muted-foreground">
                      Nåværende: {(activeConfig.aiAnalysis.confidenceThreshold * 100).toFixed(0)}%
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reporting" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Standard rapportmal</Label>
                <Select
                  value={activeConfig.reporting.defaultTemplate}
                  onValueChange={(value) => updateReportingConfig('defaultTemplate', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Omfattende rapport</SelectItem>
                    <SelectItem value="executive">Ledersammendrag</SelectItem>
                    <SelectItem value="technical">Teknisk rapport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Lagringstid (dager)</Label>
                <Slider
                  value={[activeConfig.reporting.retentionDays]}
                  onValueChange={([value]) => updateReportingConfig('retentionDays', value)}
                  max={2555}
                  min={30}
                  step={30}
                />
                <div className="text-xs text-muted-foreground">
                  Nåværende: {activeConfig.reporting.retentionDays} dager ({Math.round(activeConfig.reporting.retentionDays / 365 * 10) / 10} år)
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Auto-generer rapport</Label>
                  <Switch
                    checked={activeConfig.reporting.autoGenerateOnComplete}
                    onCheckedChange={(checked) => updateReportingConfig('autoGenerateOnComplete', checked)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Inkluder sensitive data</Label>
                  <Switch
                    checked={activeConfig.reporting.includeSensitiveData}
                    onCheckedChange={(checked) => updateReportingConfig('includeSensitiveData', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button 
            onClick={handleSaveConfiguration}
            disabled={validationErrors.length > 0}
            className="flex items-center gap-2"
          >
            {validationErrors.length === 0 ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            Lagre konfigurasjon
          </Button>

          <Button
            onClick={handleExportConfiguration}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Eksporter
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfiguration}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Importer konfigurasjon"
            />
            <Button variant="outline" className="flex items-center gap-2 pointer-events-none">
              <Upload className="w-4 h-4" />
              Importer
            </Button>
          </div>

          <Button
            onClick={() => handleConfigurationSelect('comprehensive')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tilbakestill
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}