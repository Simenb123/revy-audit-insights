import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Send,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssertionsMatrixProps {
  sessionId: string;
  onSendToPlan?: (selectedTests: AssertionTest[]) => void;
  onComplete?: (matrixData: MatrixData) => void;
}

interface MatrixData {
  areas: AssertionArea[];
  selectedTests: AssertionTest[];
  riskAssessment: RiskLevel;
  completedAssertions: string[];
}

interface AssertionArea {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  assertions: AssertionMapping[];
}

interface AssertionMapping {
  assertion: AssertionType;
  riskLevel: RiskLevel;
  testSuggestions: string[];
  coverage: 'none' | 'limited' | 'adequate' | 'extensive';
  notes: string;
}

interface AssertionTest {
  id: string;
  area: string;
  assertion: AssertionType;
  testName: string;
  testType: 'analytical' | 'detail' | 'observation' | 'inquiry';
  estimatedHours: number;
  riskResponse: RiskLevel;
  isaReferences: string[];
}

type AssertionType = 'Gyldighet' | 'Fullstendighet' | 'Nøyaktighet' | 'Periodisering' | 'Klassifisering';
type RiskLevel = 'lav' | 'moderat' | 'høy';

const ASSERTION_DEFINITIONS = {
  'Gyldighet': 'Transaksjoner og hendelser er reelle og har faktisk oppstått',
  'Fullstendighet': 'Alle transaksjoner og hendelser som skulle vært registrert er registrert',
  'Nøyaktighet': 'Beløp og andre data er registrert korrekt',
  'Periodisering': 'Transaksjoner og hendelser er registrert i riktig periode',
  'Klassifisering': 'Transaksjoner og hendelser er klassifisert på riktige kontoer'
};

const AREAS_DATA: AssertionArea[] = [
  {
    id: 'revenue',
    name: 'Inntekter',
    description: 'Salg og andre driftsinntekter',
    riskLevel: 'høy',
    assertions: [
      {
        assertion: 'Gyldighet',
        riskLevel: 'høy',
        testSuggestions: ['Bekreftelser fra kunder', 'Gjennomgang av salgsdokumentasjon'],
        coverage: 'adequate',
        notes: 'Høy risiko grunnet bonus-system'
      },
      {
        assertion: 'Fullstendighet',
        riskLevel: 'moderat',
        testSuggestions: ['Cutoff-testing', 'Analytiske prosedyrer'],
        coverage: 'limited',
        notes: ''
      },
      {
        assertion: 'Periodisering',
        riskLevel: 'høy',
        testSuggestions: ['Gjennomgang av periodiseringer', 'Cutoff ved årsskifte'],
        coverage: 'none',
        notes: 'Bonus påvirker periodisering'
      },
      {
        assertion: 'Nøyaktighet',
        riskLevel: 'moderat',
        testSuggestions: ['Detaljkontroller av fakturaer', 'Prising og rabatter'],
        coverage: 'limited',
        notes: ''
      },
      {
        assertion: 'Klassifisering',
        riskLevel: 'lav',
        testSuggestions: ['Kontroll av kontokodinger'],
        coverage: 'adequate',
        notes: ''
      }
    ]
  },
  {
    id: 'inventory',
    name: 'Varelager',
    description: 'Varelagre og nedskrivninger',
    riskLevel: 'høy',
    assertions: [
      {
        assertion: 'Gyldighet',
        riskLevel: 'moderat',
        testSuggestions: ['Varetellingsobservasjon', 'Kontroll av eierskap'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Fullstendighet',
        riskLevel: 'moderat',
        testSuggestions: ['Varetelling', 'Cutoff-testing'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Nøyaktighet',
        riskLevel: 'høy',
        testSuggestions: ['Nedskrivningstest', 'Kostprisberegninger'],
        coverage: 'limited',
        notes: 'Risiko for overvurdering'
      },
      {
        assertion: 'Periodisering',
        riskLevel: 'moderat',
        testSuggestions: ['Cutoff varekjøp og salg'],
        coverage: 'limited',
        notes: ''
      },
      {
        assertion: 'Klassifisering',
        riskLevel: 'lav',
        testSuggestions: ['Kontroll av varegrupper'],
        coverage: 'adequate',
        notes: ''
      }
    ]
  },
  {
    id: 'receivables',
    name: 'Kundefordringer',
    description: 'Fordringer på kunder og nedskrivninger',
    riskLevel: 'moderat',
    assertions: [
      {
        assertion: 'Gyldighet',
        riskLevel: 'moderat',
        testSuggestions: ['Kundebekreftelser', 'Kontroll av kreditnotaer'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Fullstendighet',
        riskLevel: 'lav',
        testSuggestions: ['Avstemming salg vs fordringer'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Nøyaktighet',
        riskLevel: 'høy',
        testSuggestions: ['Aldersanalyse', 'Nedskrivningsvurdering'],
        coverage: 'limited',
        notes: 'Mange fordringer >180 dager'
      },
      {
        assertion: 'Periodisering',
        riskLevel: 'moderat',
        testSuggestions: ['Cutoff-testing'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Klassifisering',
        riskLevel: 'lav',
        testSuggestions: ['Kontroll av kortsiktig vs langsiktig'],
        coverage: 'adequate',
        notes: ''
      }
    ]
  },
  {
    id: 'investments',
    name: 'Investeringer',
    description: 'Driftsmidler og investeringer',
    riskLevel: 'moderat',
    assertions: [
      {
        assertion: 'Gyldighet',
        riskLevel: 'moderat',
        testSuggestions: ['Kontroll av eierskap', 'Gjennomgang av kjøpskontrakter'],
        coverage: 'limited',
        notes: '3 MNOK oppussing - klassifisering?'
      },
      {
        assertion: 'Fullstendighet',
        riskLevel: 'lav',
        testSuggestions: ['Kontroll av tilganger i året'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Nøyaktighet',
        riskLevel: 'moderat',
        testSuggestions: ['Avskrivningsberegninger', 'Nedskrivingsvurdering'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Periodisering',
        riskLevel: 'høy',
        testSuggestions: ['Kontroll av aktiveringstidspunkt'],
        coverage: 'none',
        notes: 'Oppussing - aktivering vs kostføring'
      },
      {
        assertion: 'Klassifisering',
        riskLevel: 'høy',
        testSuggestions: ['Klassifisering drift vs investering'],
        coverage: 'none',
        notes: 'Oppussing klassifisering usikker'
      }
    ]
  },
  {
    id: 'debt',
    name: 'Gjeld',
    description: 'Kortsiktig og langsiktig gjeld',
    riskLevel: 'høy',
    assertions: [
      {
        assertion: 'Gyldighet',
        riskLevel: 'moderat',
        testSuggestions: ['Leverandørbekreftelser', 'Kontroll av gjeldsbreiev'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Fullstendighet',
        riskLevel: 'høy',
        testSuggestions: ['Søk etter ikke registrert gjeld', 'Cutoff-testing'],
        coverage: 'limited',
        notes: '1 MNOK lån til DL - registrert?'
      },
      {
        assertion: 'Nøyaktighet',
        riskLevel: 'moderat',
        testSuggestions: ['Avstemming lån', 'Rentekontroller'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Periodisering',
        riskLevel: 'moderat',
        testSuggestions: ['Periodiseringskontroller'],
        coverage: 'adequate',
        notes: ''
      },
      {
        assertion: 'Klassifisering',
        riskLevel: 'høy',
        testSuggestions: ['Kortsiktig vs langsiktig', 'Lån til nærstående'],  
        coverage: 'none',
        notes: 'DL-lån - klassifisering og lovlighet'
      }
    ]
  }
];

export const AssertionsMatrix: React.FC<AssertionsMatrixProps> = ({
  sessionId,
  onSendToPlan,
  onComplete
}) => {
  const [areas] = useState<AssertionArea[]>(AREAS_DATA);
  const [selectedTests, setSelectedTests] = useState<AssertionTest[]>([]);
  const [view, setView] = useState<'matrix' | 'analysis'>('matrix');
  const { toast } = useToast();

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'høy': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderat': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'lav': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getCoverageIcon = (coverage: string) => {
    switch (coverage) {
      case 'extensive': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'adequate': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'limited': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'none': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const handleSuggestTest = (area: AssertionArea, assertion: AssertionMapping) => {
    const testId = `${area.id}-${assertion.assertion}`;
    
    if (selectedTests.find(t => t.id === testId)) {
      toast({
        title: "Test allerede valgt",
        description: `Test for ${assertion.assertion} i ${area.name} er allerede lagt til.`,
        variant: "destructive",
      });
      return;
    }

    const newTest: AssertionTest = {
      id: testId,
      area: area.name,
      assertion: assertion.assertion,
      testName: assertion.testSuggestions[0] || `${assertion.assertion} test`,
      testType: assertion.assertion === 'Nøyaktighet' ? 'detail' : 'analytical',
      estimatedHours: assertion.riskLevel === 'høy' ? 8 : assertion.riskLevel === 'moderat' ? 4 : 2,
      riskResponse: assertion.riskLevel,
      isaReferences: getISAReferences(assertion.assertion)
    };

    setSelectedTests(prev => [...prev, newTest]);
    
    toast({
      title: "Test foreslått",
      description: `${newTest.testName} lagt til i utvalgsplan.`,
    });
  };

  const getISAReferences = (assertion: AssertionType): string[] => {
    const references: Record<AssertionType, string[]> = {
      'Gyldighet': ['ISA 500', 'ISA 505'],
      'Fullstendighet': ['ISA 500', 'ISA 520'],
      'Nøyaktighet': ['ISA 500', 'ISA 530'],
      'Periodisering': ['ISA 500', 'ISA 540'],
      'Klassifisering': ['ISA 500', 'ISA 315']
    };
    return references[assertion] || ['ISA 500'];
  };

  const handleSendToPlan = () => {
    if (selectedTests.length === 0) {
      toast({
        title: "Ingen tester valgt",
        description: "Velg minst én test før du sender til plan.",
        variant: "destructive",
      });
      return;
    }

    onSendToPlan?.(selectedTests);
    
    toast({
      title: "Sendt til samplingplan",
      description: `${selectedTests.length} tester sendt til SamplingWizard.`,
    });
  };

  const testTableColumns: StandardDataTableColumn<AssertionTest>[] = [
    {
      key: 'area',
      header: 'Område',
      accessor: 'area',
    },
    {
      key: 'assertion',
      header: 'Påstand',
      accessor: 'assertion',
      format: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'testName',
      header: 'Foreslått test',
      accessor: 'testName',
    },
    {
      key: 'testType',
      header: 'Type',
      accessor: 'testType',
      format: (value) => {
        const types = {
          'analytical': 'Analytisk',
          'detail': 'Detalj',
          'observation': 'Observasjon',
          'inquiry': 'Forespørsel'
        };
        return types[value as keyof typeof types] || value;
      }
    },
    {
      key: 'estimatedHours',
      header: 'Timer',
      accessor: 'estimatedHours',
      align: 'right'
    },
    {
      key: 'riskResponse',
      header: 'Risiko',
      accessor: 'riskResponse',
      format: (value) => (
        <Badge variant="outline" className={getRiskColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: 'id',
      format: (id) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTests(prev => prev.filter(t => t.id !== id))}
        >
          Fjern
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Påstands-matrise - Nordic Varehandel AS
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={view === 'matrix' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('matrix')}
              >
                Matrise
              </Button>
              <Button 
                variant={view === 'analysis' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('analysis')}
              >
                Analyse
              </Button>
            </div>
          </div>
          <CardDescription>
            Analyser revisjonsrisiko og foreslå handlinger per påstand og område
          </CardDescription>
        </CardHeader>
      </Card>

      {view === 'matrix' && (
        <div className="space-y-6">
          {/* Assertions Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Påstandsdefinisjoner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(ASSERTION_DEFINITIONS).map(([assertion, definition]) => (
                  <div key={assertion} className="flex gap-3 p-3 border rounded-lg">
                    <Badge variant="outline" className="shrink-0">
                      {assertion}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{definition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Matrix */}
          <div className="space-y-6">
            {areas.map((area) => (
              <Card key={area.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      <CardDescription>{area.description}</CardDescription>
                    </div>
                    <Badge className={getRiskColor(area.riskLevel)}>
                      Risiko: {area.riskLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {area.assertions.map((assertion) => (
                      <div key={assertion.assertion} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">{assertion.assertion}</Badge>
                              <Badge className={getRiskColor(assertion.riskLevel)}>
                                {assertion.riskLevel}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {getCoverageIcon(assertion.coverage)}
                                <span className="text-sm capitalize">{assertion.coverage}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <strong>Foreslåtte tester:</strong>
                                <ul className="mt-1 ml-4">
                                  {assertion.testSuggestions.map((test, idx) => (
                                    <li key={idx} className="list-disc">{test}</li>
                                  ))}
                                </ul>
                              </div>
                              
                              {assertion.notes && (
                                <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400">
                                  <strong>Merknad:</strong> {assertion.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => handleSuggestTest(area, assertion)}
                            disabled={assertion.coverage === 'extensive'}
                          >
                            Foreslå test
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === 'analysis' && (
        <div className="space-y-6">
          {/* Selected Tests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Foreslåtte revisjonshandlinger</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedTests.length} tester
                  </Badge>
                  <Badge variant="outline">
                    {selectedTests.reduce((sum, test) => sum + test.estimatedHours, 0)} timer
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTests.length > 0 ? (
                <StandardDataTable
                  data={selectedTests}
                  columns={testTableColumns}
                  tableName="assertion-tests"
                  title="Foreslåtte tester"
                  enableExport={true}
                  pageSize={10}
                />
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <p>Ingen tester foreslått ennå.</p>
                  <p className="text-sm">Gå til matrise-visning og foreslå tester basert på risikovurdering.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Risikosammendrag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {areas.filter(a => a.riskLevel === 'høy').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Høyrisikoområder</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {areas.flatMap(a => a.assertions).filter(a => a.coverage === 'none' || a.coverage === 'limited').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Utilstrekkelig dekning</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedTests.reduce((sum, test) => sum + test.estimatedHours, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Timer planlagt</div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2 text-sm">
                <h4 className="font-medium">Kritiske områder som krever oppmerksomhet:</h4>
                <ul className="space-y-1 ml-4">
                  <li className="list-disc">Inntektsperiodisering - bonus-system påvirker årsavslutning</li>
                  <li className="list-disc">Varelager nedskrivning - høy risiko for overvurdering</li> 
                  <li className="list-disc">Kundefordringer over 180 dager - nedskrivningsbehov</li>
                  <li className="list-disc">3 MNOK oppussing - klassifisering drift vs investering</li>
                  <li className="list-disc">1 MNOK lån til DL - lovlighet og klassifisering</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setView('matrix')}>
              Tilbake til matrise
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSendToPlan}
                disabled={selectedTests.length === 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send til samplingplan
              </Button>
              
              <Button
                onClick={() => onComplete?.({
                  areas,
                  selectedTests,
                  riskAssessment: 'høy',
                  completedAssertions: Array.from(new Set(selectedTests.map(t => t.assertion)))
                })}
                variant="default"
              >
                <FileText className="h-4 w-4 mr-2" />
                Fullfør analyse
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};