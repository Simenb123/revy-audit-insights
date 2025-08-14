import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  XCircle,
  Lightbulb,
  HelpCircle
} from 'lucide-react';

interface AnalysisStatusCardProps {
  dataLoading?: boolean;
  dataError?: string | null;
  analysisRunning?: boolean;
  analysisProgress?: number;
  analysisError?: string | null;
  lastAnalysisTime?: string;
  totalAnalysesRun?: number;
  className?: string;
  onRetry?: () => void;
}

const AnalysisStatusCard: React.FC<AnalysisStatusCardProps> = ({
  dataLoading = false,
  dataError = null,
  analysisRunning = false,
  analysisProgress = 0,
  analysisError = null,
  lastAnalysisTime,
  totalAnalysesRun = 0,
  className = "",
  onRetry
}) => {
  const getMainStatus = () => {
    if (dataError) return { status: 'error', message: 'Datafeil oppdaget' };
    if (dataLoading) return { status: 'loading', message: 'Laster data...' };
    if (analysisError) return { status: 'analysis_error', message: 'Analysefeil' };
    if (analysisRunning) return { status: 'running', message: 'Analyse pågår...' };
    return { status: 'ready', message: 'Klar for analyse' };
  };

  const mainStatus = getMainStatus();

  const getStatusIcon = () => {
    switch (mainStatus.status) {
      case 'ready': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'loading': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error': 
      case 'analysis_error': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (mainStatus.status) {
      case 'ready': return 'border-green-200 bg-green-50';
      case 'loading': 
      case 'running': return 'border-blue-200 bg-blue-50';
      case 'error': 
      case 'analysis_error': return 'border-red-200 bg-red-50';
      default: return 'border-yellow-200 bg-yellow-50';
    }
  };

  const renderErrorHelp = () => {
    if (dataError) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <div className="font-medium">Datafeil:</div>
              <div className="text-sm">{dataError}</div>
              <div className="text-sm">
                <strong>Løsningsforslag:</strong>
                <ul className="list-disc list-inside mt-1">
                  <li>Sjekk at dataversjonen er valgt</li>
                  <li>Kontroller at data er ferdig prosessert</li>
                  <li>Prøv å laste siden på nytt</li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (analysisError) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <div className="font-medium">Analysefeil:</div>
              <div className="text-sm">{analysisError}</div>
              <div className="text-sm">
                <strong>Mulige årsaker:</strong>
                <ul className="list-disc list-inside mt-1">
                  <li>AI-tjenesten er midlertidig utilgjengelig</li>
                  <li>For lite data for analysen</li>
                  <li>Nettverksproblemer</li>
                </ul>
              </div>
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Prøv igjen
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const renderProgressInfo = () => {
    if (analysisRunning) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Fremdrift</span>
            <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
          </div>
          <Progress value={analysisProgress} className="w-full" />
          <Alert className="border-blue-200 bg-blue-50">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Analysen kan ta noen minutter. Du kan navigere til andre deler av systemet mens du venter.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return null;
  };

  const renderDataLoadingInfo = () => {
    if (dataLoading) {
      return (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              <div>Data lastes inn i bakgrunnen...</div>
              <div className="text-sm text-blue-600">
                Dette kan ta noen minutter for store datasett. Analyser blir tilgjengelige når lastingen er ferdig.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <Card className={`${getStatusColor()} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-base">{mainStatus.message}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {totalAnalysesRun > 0 && (
              <Badge variant="secondary">
                {totalAnalysesRun} analyser kjørt
              </Badge>
            )}
            {lastAnalysisTime && (
              <Badge variant="outline" className="text-xs">
                Sist: {new Date(lastAnalysisTime).toLocaleTimeString('nb-NO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Systemstatus og analyseoversikt
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderDataLoadingInfo()}
        {renderProgressInfo()}
        {renderErrorHelp()}
        
        {mainStatus.status === 'ready' && totalAnalysesRun === 0 && (
          <Alert>
            <HelpCircle className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Klar til å starte!</div>
                <div className="text-sm">
                  Vi anbefaler å begynne med "Grunnleggende transaksjonsanalyse" for å få en oversikt over dataene dine.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisStatusCard;