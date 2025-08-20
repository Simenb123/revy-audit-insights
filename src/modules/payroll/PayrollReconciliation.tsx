import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, FileSpreadsheet, Upload, CheckCircle, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// Import our custom hooks and utilities
import { useAllCodes } from './hooks/useCodes';
import { useMappingRules, useCreateMappingRule, useUpdateMappingRule, useDeleteMappingRule, useBulkCreateMappingRules } from './hooks/useMappingRules';
import { parseA07, validateA07, type A07Row, type ValidationError } from './lib/a07';
import { readSpreadsheet, tbToGL, filterPayrollEntries, getWorksheetPreview, type GLEntry, type TBWorksheet } from './lib/tb';
import { findExactMatches, generateExclusiveRules, type ExactMatchResult } from './lib/exactMatch';

const PayrollReconciliation = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();

  // State for A07 data
  const [a07Json, setA07Json] = useState('');
  const [a07Data, setA07Data] = useState<{ rows: A07Row[]; totals: Record<string, number> } | null>(null);
  const [a07Errors, setA07Errors] = useState<ValidationError[]>([]);

  // State for TB data
  const [tbFile, setTbFile] = useState<File | null>(null);
  const [tbWorksheets, setTbWorksheets] = useState<TBWorksheet[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>('');
  const [tbColumnMapping, setTbColumnMapping] = useState({
    accCol: '',
    textCol: '',
    amtCol: '',
    dateCol: ''
  });
  const [glEntries, setGlEntries] = useState<GLEntry[]>([]);
  
  // State for exact matches
  const [exactMatches, setExactMatches] = useState<Record<string, ExactMatchResult> | null>(null);

  // Fetch data
  const { ameldingCodes, ameldingCodeMap, internalCodes, isLoading: codesLoading } = useAllCodes();
  const { data: mappingRules = [], isLoading: rulesLoading } = useMappingRules(clientId || '');
  const createRule = useCreateMappingRule();
  const updateRule = useUpdateMappingRule();
  const deleteRule = useDeleteMappingRule();
  const bulkCreateRules = useBulkCreateMappingRules();

  React.useEffect(() => {
    if (client?.id) setSelectedClientId(client.id);
  }, [client?.id, setSelectedClientId]);

  // Parse A07 JSON
  const handleA07Import = () => {
    try {
      const jsonData = JSON.parse(a07Json);
      const parsed = parseA07(jsonData, ameldingCodeMap);
      const errors = validateA07(parsed.rows, ameldingCodes);
      
      setA07Data(parsed);
      setA07Errors(errors);
      
      if (errors.length === 0) {
        toast({
          title: 'A07 importert',
          description: `${parsed.rows.length} linjer importert uten feil.`,
        });
      } else {
        toast({
          title: 'A07 importert med advarsler',
          description: `${parsed.rows.length} linjer importert, ${errors.length} advarsler.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Feil ved A07 import',
        description: 'Ugyldig JSON format.',
        variant: 'destructive',
      });
    }
  };

  // Handle TB file upload
  const handleTbFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setTbFile(file);
      const worksheets = await readSpreadsheet(file);
      setTbWorksheets(worksheets);
      if (worksheets.length > 0) {
        setSelectedWorksheet(worksheets[0].name);
      }
      toast({
        title: 'Fil lastet opp',
        description: `${worksheets.length} ark funnet.`,
      });
    } catch (error) {
      toast({
        title: 'Feil ved opplasting',
        description: 'Kunne ikke lese filen.',
        variant: 'destructive',
      });
    }
  };

  // Process TB data
  const handleTbProcess = () => {
    const worksheet = tbWorksheets.find(w => w.name === selectedWorksheet);
    if (!worksheet || !tbColumnMapping.accCol || !tbColumnMapping.textCol || !tbColumnMapping.amtCol) {
      toast({
        title: 'Manglende konfigurasjon',
        description: 'Velg ark og alle nødvendige kolonner.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const entries = tbToGL(worksheet.data, tbColumnMapping);
      const { payroll, accruals } = filterPayrollEntries(entries);
      setGlEntries([...payroll, ...accruals]);
      
      toast({
        title: 'TB prosessert',
        description: `${payroll.length} lønn og ${accruals.length} avsetning linjer funnet.`,
      });
    } catch (error) {
      toast({
        title: 'Feil ved prosessering',
        description: 'Kunne ikke prosessere TB data.',
        variant: 'destructive',
      });
    }
  };

  // Calculate reconciliation (A-E)
  const reconciliationData = useMemo(() => {
    if (!a07Data || glEntries.length === 0) return [];

    const results: Array<{
      code: string;
      description: string;
      accounts: string[];
      A: number;
      B: number;
      C: number;
      D: number;
      E: number;
      amelding: number;
      difference: number;
    }> = [];

    internalCodes.forEach(internalCode => {
      const A = a07Data.totals[internalCode.id] || 0;
      
      // B/C calculation from accrual entries (294x/295x)
      let B = 0, C = 0;
      const accountsUsed = new Set<string>();
      
      glEntries.forEach(entry => {
        const accountNum = entry.account.replace(/\D/g, '');
        const first3Digits = accountNum.substring(0, 3);
        if (first3Digits === '294' || first3Digits === '295') {
          accountsUsed.add(entry.account);
          // Rules could determine which internal code this maps to
          // For now, default to 'feriepenger' for accruals
          if (internalCode.id === 'feriepenger' || !mappingRules.find(r => r.account === entry.account)) {
            if (entry.amount < 0) {
              B += Math.abs(entry.amount);
            } else {
              C += entry.amount;
            }
          }
        }
      });

      const D = A + B - C;
      const E = internalCode.aga ? D : 0;
      const amelding = A; // A07 reported amount
      const difference = Math.abs(D - amelding);

      results.push({
        code: internalCode.id,
        description: internalCode.label,
        accounts: Array.from(accountsUsed),
        A,
        B,
        C,
        D,
        E,
        amelding,
        difference
      });
    });

    return results;
  }, [a07Data, glEntries, internalCodes, mappingRules]);

  // Run exact match
  const handleExactMatch = () => {
    if (!a07Data || glEntries.length === 0) {
      toast({
        title: 'Manglende data',
        description: 'Last inn både A07 og TB data først.',
        variant: 'destructive',
      });
      return;
    }

    const matches = findExactMatches(glEntries, a07Data.totals, mappingRules, 5);
    setExactMatches(matches);
    
    const exactCount = Object.values(matches).filter(m => m.exact !== null).length;
    toast({
      title: 'Eksakt match kjørt',
      description: `${exactCount} eksakte match funnet.`,
    });
  };

  // Accept exact matches
  const handleAcceptExactMatches = () => {
    if (!exactMatches || !clientId) return;

    const newRules = generateExclusiveRules(exactMatches, clientId);
    const rulesToCreate = newRules.map(rule => ({
      ...rule,
      client_id: clientId,
    }));

    bulkCreateRules.mutate(rulesToCreate as any);
  };

  if (isLoading || codesLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
          <p className="text-muted-foreground">Kunne ikke finne klient med ID {clientId}</p>
        </div>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle="Kontrolloppstilling lønn"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            <Tabs defaultValue="rules" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="rules">Regler</TabsTrigger>
                <TabsTrigger value="data">Datagrunnlag</TabsTrigger>
                <TabsTrigger value="reconciliation">Avstemming</TabsTrigger>
                <TabsTrigger value="exact-match">Eksakt match</TabsTrigger>
                <TabsTrigger value="ai-suggest">AI-forslag</TabsTrigger>
              </TabsList>

              {/* Rules Panel */}
              <TabsContent value="rules" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mapping regler</CardTitle>
                    <CardDescription>
                      Konfigurer hvordan kontoer skal mappes til interne koder
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Konto</TableHead>
                            <TableHead>Intern kode</TableHead>
                            <TableHead>Strategi</TableHead>
                            <TableHead>Vekt</TableHead>
                            <TableHead>Nøkkelord</TableHead>
                            <TableHead>Handlinger</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mappingRules.map((rule) => (
                            <TableRow key={rule.id}>
                              <TableCell>{rule.account}</TableCell>
                              <TableCell>{rule.code}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{rule.strategy}</Badge>
                              </TableCell>
                              <TableCell>{rule.weight}</TableCell>
                              <TableCell>{rule.keywords.join(', ')}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteRule.mutate({ id: rule.id, clientId: clientId! })}
                                >
                                  Slett
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Data Panel */}
              <TabsContent value="data" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* A07 Import */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        A07 JSON Import
                      </CardTitle>
                      <CardDescription>
                        Lim inn A07 JSON data for validering og parsing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="a07-json">A07 JSON Data</Label>
                        <Textarea
                          id="a07-json"
                          rows={8}
                          value={a07Json}
                          onChange={(e) => setA07Json(e.target.value)}
                          placeholder="Lim inn A07 JSON data her..."
                        />
                      </div>
                      <Button onClick={handleA07Import} disabled={!a07Json.trim()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importer A07
                      </Button>
                      
                      {a07Errors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Valideringsfeil ({a07Errors.length})
                          </h4>
                          {a07Errors.map((error, index) => (
                            <Badge key={index} variant="destructive">
                              {error.beskrivelse}: {error.error}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {a07Data && (
                        <div className="text-sm text-muted-foreground">
                          ✓ {a07Data.rows.length} A07 linjer importert
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* TB Import */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Saldobalanse Import
                      </CardTitle>
                      <CardDescription>
                        Last opp XLSX/CSV fil med saldobalanse
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="tb-file">Velg fil</Label>
                        <Input
                          id="tb-file"
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleTbFileUpload}
                        />
                      </div>
                      
                      {tbWorksheets.length > 0 && (
                        <>
                          <div>
                            <Label htmlFor="worksheet">Velg ark</Label>
                            <Select value={selectedWorksheet} onValueChange={setSelectedWorksheet}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {tbWorksheets.map((ws) => (
                                  <SelectItem key={ws.name} value={ws.name}>
                                    {ws.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="acc-col">Konto kolonne</Label>
                              <Input
                                id="acc-col"
                                value={tbColumnMapping.accCol}
                                onChange={(e) => setTbColumnMapping(prev => ({ ...prev, accCol: e.target.value }))}
                                placeholder="konto"
                              />
                            </div>
                            <div>
                              <Label htmlFor="text-col">Tekst kolonne</Label>
                              <Input
                                id="text-col"
                                value={tbColumnMapping.textCol}
                                onChange={(e) => setTbColumnMapping(prev => ({ ...prev, textCol: e.target.value }))}
                                placeholder="tekst"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="amt-col">Beløp kolonne</Label>
                            <Input
                              id="amt-col"
                              value={tbColumnMapping.amtCol}
                              onChange={(e) => setTbColumnMapping(prev => ({ ...prev, amtCol: e.target.value }))}
                              placeholder="beløp"
                            />
                          </div>

                          <Button 
                            onClick={handleTbProcess}
                            disabled={!tbColumnMapping.accCol || !tbColumnMapping.textCol || !tbColumnMapping.amtCol}
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Prosesser data
                          </Button>
                        </>
                      )}

                      {glEntries.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          ✓ {glEntries.length} regnskapslinjer prosessert
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Reconciliation Panel */}
              <TabsContent value="reconciliation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>A-E Avstemming</CardTitle>
                    <CardDescription>
                      Sammenligning mellom A07 data og regnskapsdata
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Beskrivelse</TableHead>
                            <TableHead>Konto(r)</TableHead>
                            <TableHead className="text-right">A (P&L)</TableHead>
                            <TableHead className="text-right">B (Neg.avs.)</TableHead>
                            <TableHead className="text-right">C (Pos.avs.)</TableHead>
                            <TableHead className="text-right">D (A+B-C)</TableHead>
                            <TableHead className="text-right">E (AGA)</TableHead>
                            <TableHead className="text-right">A-melding</TableHead>
                            <TableHead className="text-right">Avvik</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reconciliationData.map((row) => (
                            <TableRow key={row.code}>
                              <TableCell className="font-mono">{row.code}</TableCell>
                              <TableCell>{row.description}</TableCell>
                              <TableCell>
                                {row.accounts.length > 0 ? row.accounts.join(', ') : '-'}
                              </TableCell>
                              <TableCell className="text-right">{row.A.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{row.B.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{row.C.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{row.D.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{row.E.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{row.amelding.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={row.difference <= 5 ? "default" : "destructive"}>
                                  {row.difference.toLocaleString()}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exact Match Panel */}
              <TabsContent value="exact-match" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Eksakt match (±5 kr)</CardTitle>
                    <CardDescription>
                      Finn nøyaktige matches mellom A07 og regnskapslinjer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={handleExactMatch} disabled={!a07Data || glEntries.length === 0}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Kjør eksakt match
                      </Button>
                      {exactMatches && (
                        <Button onClick={handleAcceptExactMatches} variant="outline">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Godta alle eksakte
                        </Button>
                      )}
                    </div>

                    {exactMatches && (
                      <div className="space-y-4">
                        {Object.entries(exactMatches).map(([code, result]) => (
                          <Card key={code}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">
                                {code} - Mål: {result.targetAmount.toLocaleString()} kr
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {result.exact ? (
                                <div className="space-y-2">
                                  <Badge variant="default" className="mb-2">
                                    ✓ Eksakt match: {result.exact.length} linjer
                                  </Badge>
                                  {result.exact.map((entry, index) => (
                                    <div key={index} className="text-sm bg-muted p-2 rounded">
                                      {entry.account}: {entry.text} - {entry.amount.toLocaleString()} kr
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Badge variant="secondary">Ingen eksakt match</Badge>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Suggestions Panel */}
              <TabsContent value="ai-suggest" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-forslag (kommer snart)</CardTitle>
                    <CardDescription>
                      AI-baserte forslag for mapping av kontoer til interne koder
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      AI-forslag funktionalitet kommer i en senere versjon
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default PayrollReconciliation;