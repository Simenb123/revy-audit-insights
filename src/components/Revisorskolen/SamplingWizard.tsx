import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Target, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  FileText
} from 'lucide-react';

// Reuse existing sampling components
import PopulationSelector from '@/components/Audit/Sampling/PopulationSelector';
import SamplingParametersForm from '@/components/Audit/Sampling/SamplingParametersForm';
import SampleResultsDisplay from '@/components/Audit/Sampling/SampleResultsDisplay';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';

// Reuse existing sampling services
import { SamplingParams, SamplingResult, SampleItem } from '@/services/sampling/types';
import { executeSampling } from '@/services/sampling/algorithms';
import { formatCurrency, formatNumber } from '@/services/sampling/utils';

// Training-specific hooks
import { useTrainingContext } from '@/hooks/useTrainingContext';
import { useUpdateSessionProgress } from '@/hooks/useTrainingSessions';

import { useToast } from '@/hooks/use-toast';

interface SamplingWizardProps {
  sessionId: string;
  onComplete?: (results: SamplingResult) => void;
}

interface TestResult {
  id: string;
  txn_id: string;
  finding_amount: number;
  finding_type: 'none' | 'overstatement' | 'understatement' | 'error';
  notes: string;
  tested_at: string;
}

export const SamplingWizard: React.FC<SamplingWizardProps> = ({ 
  sessionId, 
  onComplete 
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [samplingParams, setSamplingParams] = useState<SamplingParams | null>(null);
  const [samplingResult, setSamplingResult] = useState<SamplingResult | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<SampleItem[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  
  const { data: context } = useTrainingContext(sessionId);
  const updateProgress = useUpdateSessionProgress();
  const { toast } = useToast();

  // Training-specific budget constraints
  const MINUTES_PER_SAMPLE = 10;
  const MAX_BUDGET_HOURS = context?.session?.default_params?.budget_hours || 100;

  // Timer for budget constraint
  useEffect(() => {
    if (activeStep === 4 && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeStep, timeRemaining]);

  const handleParametersChange = (params: SamplingParams) => {
    setSamplingParams(params);
  };

  const handleGenerateSample = async () => {
    if (!samplingParams) return;

    try {
      // Apply training-specific budget constraints
      const estimatedHours = (samplingParams.sampleSize || 50) * (MINUTES_PER_SAMPLE / 60);
      
      if (estimatedHours > MAX_BUDGET_HOURS) {
        const maxSamples = Math.floor(MAX_BUDGET_HOURS / (MINUTES_PER_SAMPLE / 60));
        toast({
          title: "Budsjett overskredet",
          description: `Utvalget krever ${estimatedHours.toFixed(1)} timer, men budsjettet er ${MAX_BUDGET_HOURS} timer. Foreslår ${maxSamples} utvalg i stedet.`,
          variant: "destructive",
        });
        return;
      }

      // Use existing sampling algorithms
      const mockPopulation = generateMockPopulation();
      const result = executeSampling(mockPopulation, samplingParams);
      
      setSamplingResult(result);
      setSelectedSamples(result.samples.total || []);
      setActiveStep(3);

      toast({
        title: "Utvalg generert",
        description: `${result.samples.total?.length || 0} transaksjoner valgt for testing.`,
      });
    } catch (error) {
      toast({
        title: "Feil ved generering",
        description: "Kunne ikke generere utvalg. Sjekk parameterne.",
        variant: "destructive",
      });
    }
  };

  const handleTestComplete = (sampleId: string, findings: TestResult) => {
    setTestResults(prev => {
      const updated = prev.filter(r => r.txn_id !== sampleId);
      return [...updated, findings];
    });
  };

  const calculateProjectedMisstatement = () => {
    if (!samplingResult || testResults.length === 0) return 0;
    
    const totalFindings = testResults.reduce((sum, result) => 
      sum + (result.finding_amount || 0), 0
    );
    
    const projectionFactor = samplingResult.populationSum / 
      (samplingResult.samples.total?.reduce((sum, item) => sum + item.bookValue, 0) || 1);
      
    return totalFindings * projectionFactor;
  };

  const calculateUpperMisstatement = () => {
    const projected = calculateProjectedMisstatement();
    const confidenceFactor = samplingParams?.confidenceLevel === 95 ? 1.96 : 2.58;
    const sampleSize = selectedSamples.length;
    const standardError = Math.sqrt(projected * (samplingResult?.populationSum || 0) / sampleSize);
    
    return projected + (confidenceFactor * standardError);
  };

  // Mock population for training purposes
  const generateMockPopulation = () => {
    const scenarios = [
      { description: "Vareinnkjøp", baseAmount: 50000, variance: 0.3 },
      { description: "Salg detaljist", baseAmount: 25000, variance: 0.5 },
      { description: "Lønnskostnader", baseAmount: 75000, variance: 0.2 },
      { description: "Driftskostnader", baseAmount: 15000, variance: 0.4 },
    ];

    return Array.from({ length: 500 }, (_, i) => {
      const scenario = scenarios[i % scenarios.length];
      const amount = scenario.baseAmount * (1 + (Math.random() - 0.5) * scenario.variance);
      
      return {
        id: `TXN_${i + 1}`,
        bookValue: Math.round(amount),
        description: `${scenario.description} ${i + 1}`,
        date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        accountNumber: `${4000 + Math.floor(Math.random() * 999)}`,
        riskScore: Math.random()
      };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const testColumns: StandardDataTableColumn<SampleItem>[] = [
    {
      key: 'id',
      header: 'Transaksjon ID',
      accessor: 'id',
    },
    {
      key: 'description',
      header: 'Beskrivelse',
      accessor: 'description',
    },
    {
      key: 'bookValue',
      header: 'Bokført beløp',
      accessor: 'bookValue',
      format: (value) => formatCurrency(value),
      align: 'right'
    },
    {
      key: 'actions',
      header: 'Testing',
      accessor: 'id',
      format: (value, row) => (
        <TestingInterface 
          sample={row}
          onComplete={(findings) => handleTestComplete(value, findings)}
          disabled={timeRemaining === 0}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              SamplingWizard - Nordic Varehandel AS
            </CardTitle>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Budsjett: {MAX_BUDGET_HOURS}t
              </Badge>
              
              {activeStep === 4 && (
                <Badge 
                  variant={timeRemaining < 60 ? "destructive" : "secondary"}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-4">
            {[
              { step: 1, label: "Populasjon", icon: Target },
              { step: 2, label: "Parametere", icon: Calculator },
              { step: 3, label: "Utvalg", icon: CheckCircle },
              { step: 4, label: "Testing", icon: FileText },
              { step: 5, label: "Konklusjon", icon: TrendingUp }
            ].map(({ step, label, icon: Icon }) => (
              <div 
                key={step}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  activeStep === step 
                    ? 'bg-primary text-primary-foreground' 
                    : activeStep > step 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Tabs value={`step-${activeStep}`} className="w-full">
        <TabsContent value="step-1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Steg 1: Velg populasjon</CardTitle>
              <CardDescription>
                Definer hvilke transaksjoner som skal inngå i utvalget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PopulationSelector clientId="training" />
              <div className="flex justify-end mt-6">
                <Button onClick={() => setActiveStep(2)}>
                  Neste: Konfigurer parametere
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step-2" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Steg 2: Konfigurer sampling-parametere</CardTitle>
              <CardDescription>
                Sett vesentlighet, risikonivå og ønsket sikkerhet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SamplingParametersForm 
                clientId="training"
                onChange={handleParametersChange}
              />
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveStep(1)}>
                  Tilbake
                </Button>
                <Button 
                  onClick={handleGenerateSample}
                  disabled={!samplingParams}
                >
                  Generer utvalg
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step-3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Steg 3: Gjennomgå utvalg</CardTitle>
              <CardDescription>
                Kontroller det genererte utvalget før testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SampleResultsDisplay result={samplingResult} />
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveStep(2)}>
                  Tilbake
                </Button>
                <Button onClick={() => setActiveStep(4)}>
                  Start testing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step-4" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Steg 4: Test utvalgte transaksjoner</CardTitle>
              <CardDescription>
                Utfør kontroller på utvalgte poster (10 min per transaksjon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardDataTable
                data={selectedSamples}
                columns={testColumns}
                tableName="sampling-testing"
                enableExport={false}
                pageSize={10}
              />
              
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-muted-foreground">
                  {testResults.length} av {selectedSamples.length} transaksjoner testet
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveStep(3)}>
                    Tilbake
                  </Button>
                  <Button 
                    onClick={() => setActiveStep(5)}
                    disabled={testResults.length < selectedSamples.length / 2}
                  >
                    Evaluer resultater
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step-5" className="space-y-6">
          <SamplingConclusion 
            samplingResult={samplingResult}
            testResults={testResults}
            projectedMisstatement={calculateProjectedMisstatement()}
            upperMisstatement={calculateUpperMisstatement()}
            materiality={samplingParams?.materiality || 0}
            onComplete={onComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Testing Interface Component
interface TestingInterfaceProps {
  sample: SampleItem;
  onComplete: (findings: TestResult) => void;
  disabled?: boolean;
}

const TestingInterface: React.FC<TestingInterfaceProps> = ({ 
  sample, 
  onComplete, 
  disabled 
}) => {
  const [findings, setFindings] = useState<TestResult>({
    id: `test_${sample.id}`,
    txn_id: sample.id,
    finding_amount: 0,
    finding_type: 'none',
    notes: '',
    tested_at: new Date().toISOString()
  });

  const handleSubmit = () => {
    onComplete(findings);
  };

  return (
    <div className="space-y-2">
      <select 
        value={findings.finding_type}
        onChange={(e) => setFindings(prev => ({ 
          ...prev, 
          finding_type: e.target.value as any 
        }))}
        disabled={disabled}
        className="w-full p-1 text-xs border rounded"
      >
        <option value="none">Ingen avvik</option>
        <option value="overstatement">Overvurdert</option>
        <option value="understatement">Undervurdert</option>
        <option value="error">Feil</option>
      </select>
      
      {findings.finding_type !== 'none' && (
        <input
          type="number"
          placeholder="Avvik beløp"
          value={findings.finding_amount}
          onChange={(e) => setFindings(prev => ({ 
            ...prev, 
            finding_amount: Number(e.target.value) 
          }))}
          disabled={disabled}
          className="w-full p-1 text-xs border rounded"
        />
      )}
      
      <Button 
        size="sm" 
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full"
      >
        {disabled ? 'Tid ute' : 'Fullfør'}
      </Button>
    </div>
  );
};

// Conclusion Component
interface SamplingConclusionProps {
  samplingResult: SamplingResult | null;
  testResults: TestResult[];
  projectedMisstatement: number;
  upperMisstatement: number;
  materiality: number;
  onComplete?: (results: SamplingResult) => void;
}

const SamplingConclusion: React.FC<SamplingConclusionProps> = ({
  samplingResult,
  testResults,
  projectedMisstatement,
  upperMisstatement,
  materiality,
  onComplete
}) => {
  const conclusion = upperMisstatement < materiality ? 'AKSEPTABEL' : 'IKKE_AKSEPTABEL';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Steg 5: Konklusjon og evaluering</CardTitle>
        <CardDescription>
          Vurdering av utvalgsresultater mot vesentlighet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Projisert feilinformasjon</Label>
              <div className="text-2xl font-bold">
                {formatCurrency(projectedMisstatement)}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Øvre feilgrense (UM)</Label>
              <div className="text-2xl font-bold">
                {formatCurrency(upperMisstatement)}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Vesentlighet</Label>
              <div className="text-xl">
                {formatCurrency(materiality)}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Badge 
              variant={conclusion === 'AKSEPTABEL' ? 'default' : 'destructive'}
              className="text-lg p-2"
            >
              {conclusion === 'AKSEPTABEL' ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Akseptabel risiko
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Ikke akseptabel risiko
                </>
              )}
            </Badge>
            
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Vurdering:</strong> {conclusion === 'AKSEPTABEL' 
                  ? 'Den øvre feilgrensen er under vesentlighetsgrensen. Utvalget indikerer akseptabel risiko for vesentlig feilinformasjon.'
                  : 'Den øvre feilgrensen overskrider vesentlighetsgrensen. Ytterligere revisjonshandlinger anbefales.'
                }
              </p>
              
              <div className="mt-4">
                <strong>Testresultater:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Testet {testResults.length} transaksjoner</li>
                  <li>• Funnet {testResults.filter(r => r.finding_type !== 'none').length} avvik</li>
                  <li>• Total avviksum: {formatCurrency(testResults.reduce((sum, r) => sum + r.finding_amount, 0))}</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={() => onComplete?.(samplingResult!)}
              className="w-full"
            >
              Fullfør sampling-øvelse
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};