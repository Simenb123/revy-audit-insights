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
import { usePayrollImports, usePayrollSummary } from '@/hooks/usePayrollImports';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { extractEmployeeIncomeRows, type A07Row, type A07ParseResult } from './lib/a07-parser';
import { readSpreadsheet, tbToGL, filterPayrollEntries, getWorksheetPreview, type GLEntry, type TBWorksheet } from './lib/tb';
import { findExactMatches, generateExclusiveRules, type ExactMatchResult } from './lib/exactMatch';

const PayrollReconciliation = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();

  // State for A07 data
  const [a07Json, setA07Json] = useState('');
  const [a07Data, setA07Data] = useState<A07ParseResult | null>(null);
  const [a07Errors, setA07Errors] = useState<string[]>([]);

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

  // Fetch existing data from database
  const { selectedFiscalYear } = useFiscalYear();
  const { data: payrollImports = [] } = usePayrollImports(clientId || '');
  const { data: activeTrialBalanceVersion } = useActiveTrialBalanceVersion(clientId || '', selectedFiscalYear);
  const { data: trialBalanceData = [] } = useTrialBalanceData(clientId || '', activeTrialBalanceVersion?.version, selectedFiscalYear);
  
  // Get the most recent payroll import for summary data
  const latestPayrollImport = payrollImports[0];
  const { data: payrollSummary } = usePayrollSummary(latestPayrollImport?.id);

  // Convert trial balance data to GL entries format for existing logic
  const dbGlEntries = useMemo(() => {
    if (!trialBalanceData.length) return [];
    
    return trialBalanceData.map(entry => ({
      account: entry.account_number,
      text: entry.account_name,
      amount: entry.closing_balance,
      date: entry.period_end_date ? new Date(entry.period_end_date) : undefined
    }));
  }, [trialBalanceData]);

  // Auto-populate A07 data from database if available
  const dbA07Data = useMemo(() => {
    if (!payrollSummary) return null;
    
    const rows: A07Row[] = [];
    const totals: Record<string, number> = {};
    
    // Map database payroll summary to internal codes via amelding_code_map
    const mapping: Record<string, string> = {
      'sum.bruttolonn': 'fastlonn',  // Maps to fastlon via amelding_code_map
      'sum.forskuddstrekk.person': 'forskuddstrekk',
      'sum.aga.innsendinger': 'arbeidsgiveravgift'
    };
    
    // Process actual payroll variables for more accurate totals
    if (payrollSummary.bruttolonn) {
      // Map A07 codes to internal codes using amelding_code_map
      ameldingCodeMap.forEach(mapEntry => {
        const a07Code = mapEntry.a07;
        const internalCode = mapEntry.internal_code;
        
        // Initialize totals for internal codes
        if (!totals[internalCode]) {
          totals[internalCode] = 0;
        }
        
        // Map specific A07 amounts to internal codes
        if (a07Code === 'fastloenn' && payrollSummary.bruttolonn) {
          // Split bruttolonn based on typical distribution or rules
          totals[internalCode] += payrollSummary.bruttolonn * 0.7; // Estimate fastlon as 70%
        }
        if (a07Code === 'timeloenn' && payrollSummary.bruttolonn) {
          totals[internalCode] += payrollSummary.bruttolonn * 0.2; // Estimate timelon as 20%
        }
        if (a07Code === 'fastTillegg' && payrollSummary.bruttolonn) {
          totals[internalCode] += payrollSummary.bruttolonn * 0.1; // Estimate tillegg as 10%
        }
      });
      
      // Set total bruttolonn for verification
      totals['total_bruttolonn'] = payrollSummary.bruttolonn;
    }
    
    if (payrollSummary.trekkPerson) {
      totals['forskuddstrekk'] = payrollSummary.trekkPerson;
    }
    if (payrollSummary.agaInns) {
      totals['arbeidsgiveravgift'] = payrollSummary.agaInns;
    }
    
    return {
      rows,
      totals,
      errors: []
    } as A07ParseResult;
  }, [payrollSummary, ameldingCodeMap]);

  // Use database data if available, otherwise fall back to manual input
  const effectiveA07Data = a07Data || dbA07Data;
  const effectiveGlEntries = glEntries.length > 0 ? glEntries : dbGlEntries;

  React.useEffect(() => {
    if (client?.id) setSelectedClientId(client.id);
  }, [client?.id, setSelectedClientId]);

  // Parse A07 JSON
  const handleA07Import = () => {
    try {
      const jsonData = JSON.parse(a07Json);
      const parsed = extractEmployeeIncomeRows(jsonData);
      
      setA07Data(parsed);
      setA07Errors(parsed.errors || []);
      
      if ((parsed.errors || []).length === 0) {
        toast({
          title: 'A07 importert',
          description: `${parsed.rows.length} linjer importert uten feil.`,
        });
      } else {
        toast({
          title: 'A07 importert med advarsler',
          description: `${parsed.rows.length} linjer importert, ${(parsed.errors || []).length} advarsler.`,
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
    if (!effectiveA07Data || effectiveGlEntries.length === 0 || !internalCodes.length) return [];

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
      const A = effectiveA07Data.totals[internalCode.id] || 0;
      
      // B/C calculation based on mapping rules for this internal code
      let B = 0, C = 0;
      const accountsUsed = new Set<string>();
      
      // Get rules that map to this internal code
      const relevantRules = mappingRules.filter(rule => rule.code === internalCode.id);
      
      effectiveGlEntries.forEach(entry => {
        // Check if this GL entry matches any rule for this internal code
        const matchingRule = relevantRules.find(rule => {
          // Account matching
          if (rule.account && entry.account.includes(rule.account)) {
            return true;
          }
          
          // Regex matching
          if (rule.regex) {
            try {
              const regex = new RegExp(rule.regex, 'i');
              if (regex.test(entry.account) || regex.test(entry.text)) {
                return true;
              }
            } catch (e) {
              console.warn('Invalid regex in rule:', rule.regex);
            }
          }
          
          // Keywords matching
          if (rule.keywords && rule.keywords.length > 0) {
            const entryText = (entry.text || '').toLowerCase();
            const accountText = (entry.account || '').toLowerCase();
            return rule.keywords.some(keyword => 
              entryText.includes(keyword.toLowerCase()) || 
              accountText.includes(keyword.toLowerCase())
            );
          }
          
          return false;
        });
        
        if (matchingRule) {
          accountsUsed.add(entry.account);
          
          // Apply strategy-based logic
          if (matchingRule.strategy === 'exclusive') {
            // For P&L accounts (5xxx), add to A component
            if (entry.account.startsWith('5')) {
              // This is already handled in A07 data, but track accounts
            }
            // For accrual accounts (294x/295x), handle B/C
            else if (entry.account.match(/^29[45]/)) {
              if (entry.amount < 0) {
                B += Math.abs(entry.amount);
              } else {
                C += entry.amount;
              }
            }
          }
          else if (matchingRule.strategy === 'split') {
            // For split strategy, allocate based on rule weight or split percentage
            const splitFactor = matchingRule.split || 1.0;
            if (entry.amount < 0) {
              B += Math.abs(entry.amount) * splitFactor;
            } else {
              C += entry.amount * splitFactor;
            }
          }
        }
      });
      
      // Fallback: If no specific rules found, use default logic for accruals
      if (relevantRules.length === 0 && internalCode.id === 'feriepenger') {
        effectiveGlEntries.forEach(entry => {
          const accountNum = entry.account.replace(/\D/g, '');
          const first3Digits = accountNum.substring(0, 3);
          if (first3Digits === '294' || first3Digits === '295') {
            accountsUsed.add(entry.account);
            if (entry.amount < 0) {
              B += Math.abs(entry.amount);
            } else {
              C += entry.amount;
            }
          }
        });
      }

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
  }, [effectiveA07Data, effectiveGlEntries, internalCodes, mappingRules]);

  // Run exact match
  const handleExactMatch = () => {
    if (!effectiveA07Data || effectiveGlEntries.length === 0) {
      toast({
        title: 'Manglende data',
        description: 'Trenger både A07 og TB data for å kjøre eksakt match.',
        variant: 'destructive',
      });
      return;
    }

    const matches = findExactMatches(effectiveGlEntries, effectiveA07Data.totals, mappingRules, 5);
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
                {/* Data Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Datagrunnlag Status
                    </CardTitle>
                    <CardDescription>
                      Oversikt over tilgjengelige data for avstemming
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* A07 Status */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${effectiveA07Data ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-medium">A07 Lønnsdata</span>
                        </div>
                        {effectiveA07Data ? (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {latestPayrollImport ? (
                              <>
                                <div>📊 Fra database: {latestPayrollImport.file_name}</div>
                                <div>📅 Periode: {latestPayrollImport.period_key}</div>
                                <div>👥 Antall mottakere: {payrollSummary?.antMott || 0}</div>
                                <div>💰 Bruttolønn: {payrollSummary?.bruttolonn?.toLocaleString() || '0'} kr</div>
                              </>
                            ) : (
                              <div>📝 Fra manuell input</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Ingen A07 data tilgjengelig
                          </div>
                        )}
                      </div>

                      {/* Trial Balance Status */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${effectiveGlEntries.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-medium">Trial Balance Data</span>
                        </div>
                        {effectiveGlEntries.length > 0 ? (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {dbGlEntries.length > 0 ? (
                              <>
                                <div>🗄️ Fra database: {trialBalanceData.length} kontoer</div>
                                <div>📋 Versjon: {activeTrialBalanceVersion?.version || 'N/A'}</div>
                                <div>📅 År: {selectedFiscalYear}</div>
                                <div>💹 Aktive poster: {effectiveGlEntries.length}</div>
                              </>
                            ) : (
                              <div>📤 Fra manuell opplasting: {effectiveGlEntries.length} poster</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Ingen trial balance data tilgjengelig
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                            Parseringsfeil ({a07Errors.length})
                          </h4>
                          {a07Errors.map((error, index) => (
                            <Badge key={index} variant="destructive">
                              {error}
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
                      <Button onClick={handleExactMatch} disabled={!effectiveA07Data || effectiveGlEntries.length === 0}>
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