import React from 'react';
import { useAccountNumberMapping } from '@/hooks/useAccountNumberMapping';
import { usePopulationAnalysis } from '@/hooks/usePopulationAnalysis';
import PopulationAnalysisSection from '@/components/Audit/Sampling/PopulationAnalysisSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';

interface PopulationAnalysisWithMappingProps {
  clientId: string;
  fiscalYear: number;
  selectedStandardNumbers: string[];
  excludedAccountNumbers: string[];
  versionKey?: string;
}

const PopulationAnalysisWithMapping: React.FC<PopulationAnalysisWithMappingProps> = ({
  clientId,
  fiscalYear,
  selectedStandardNumbers,
  excludedAccountNumbers,
  versionKey
}) => {
  // 1) Map standardnumre → kontonumre før analyse
  const { 
    populationAccountNumbers, 
    isLoading: isMappingLoading,
    hasData: hasMappedAccounts 
  } = useAccountNumberMapping(clientId, selectedStandardNumbers, versionKey);

  // 2) Bruk standardnummer-varianten (enklest når brukeren klikker 10/20/70-chips)
  const { 
    data: analysisData, 
    isLoading: isAnalysisLoading, 
    error: analysisError 
  } = usePopulationAnalysis(
    clientId,
    fiscalYear,
    selectedStandardNumbers,
    excludedAccountNumbers,
    versionKey,
    populationAccountNumbers // Pass mapped accounts to gate the query
  );

  // Debug logging (midlertidig)
  console.debug('[PopulationAnalysisWithMapping] Standards:', selectedStandardNumbers);
  console.debug('[PopulationAnalysisWithMapping] Mapped accounts:', populationAccountNumbers.length);
  console.debug('[PopulationAnalysisWithMapping] Analysis enabled:', hasMappedAccounts);
  console.debug('[PopulationAnalysisWithMapping] Analysis data:', !!analysisData);

  // 3) Rendre tabs uansett - ikke {hasData && <Tabs/>}
  // Check if we have results based on basic stats
  const hasResults = !!analysisData && !analysisData.metadata?.isEmpty;
  const isLoading = isMappingLoading || isAnalysisLoading;

  // Show loading state while mapping or analyzing
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground">Populasjonsanalyse</h3>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
            <p className="text-muted-foreground">
              {isMappingLoading ? 'Mapper kontonumre...' : 'Analyserer populasjon...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (analysisError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground">Populasjonsanalyse</h3>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Analyse feil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {analysisError.message || 'Ukjent feil under analyse'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty mapping state
  if (selectedStandardNumbers.length > 0 && !hasMappedAccounts) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground">Populasjonsanalyse</h3>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tom populasjon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ingen kontonumre funnet for valgte standardlinjer. Sjekk at kontoplanen er lastet opp og at trial balance mappings eksisterer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Always render PopulationAnalysisSection, let it handle empty states internally
  return (
    <PopulationAnalysisSection 
      analysisData={analysisData} 
      excludedAccountNumbers={excludedAccountNumbers}
    />
  );
};

export default PopulationAnalysisWithMapping;