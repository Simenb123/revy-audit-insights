import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, BookOpen, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LegalKnowledgeService } from '@/services/legal-knowledge/legalKnowledgeService';
import { LawSpecificExcelService, LawStructureImportResult } from '@/services/legal-knowledge/lawSpecificExcelService';
import type { LegalDocument, LegalProvision } from '@/types/legal-knowledge';
import { toast } from 'sonner';

interface LawInfo {
  id: string;
  law_identifier: string;
  law_full_name: string;
  description?: string;
  created_at?: string;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Velg lov',
    description: 'Velg eksisterende lov eller opprett ny'
  },
  {
    id: 2,
    title: 'Last opp struktur',
    description: 'Last opp kapitler og paragrafer for valgt lov'
  },
  {
    id: 3,
    title: 'Bekreft import',
    description: 'Bekreft og importer data til databasen'
  }
];

interface LawSelectionWizardProps {
  onBack?: () => void;
}

export const LawSelectionWizard: React.FC<LawSelectionWizardProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLaw, setSelectedLaw] = useState<LawInfo | null>(null);
  const [newLawData, setNewLawData] = useState({
    law_identifier: '',
    law_full_name: '',
    description: ''
  });
  const [importResult, setImportResult] = useState<LawStructureImportResult | null>(null);
  const [isCreatingLaw, setIsCreatingLaw] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const queryClient = useQueryClient();

  // Fetch existing laws
  const { data: existingLaws, isLoading: lawsLoading } = useQuery({
    queryKey: ['existing-laws'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_provisions')
        .select('law_identifier, law_full_name')
        .not('law_identifier', 'is', null)
        .not('law_full_name', 'is', null);
      
      if (error) throw error;
      
      // Group by law and create unique entries
      const uniqueLaws = data.reduce((acc: Record<string, LawInfo>, provision) => {
        if (!acc[provision.law_identifier]) {
          acc[provision.law_identifier] = {
            id: provision.law_identifier,
            law_identifier: provision.law_identifier,
            law_full_name: provision.law_full_name || '',
            description: `Eksisterende lov med ${data.filter(p => p.law_identifier === provision.law_identifier).length} bestemmelser`
          };
        }
        return acc;
      }, {});
      
      return Object.values(uniqueLaws);
    }
  });

  // Create new law mutation
  const createLawMutation = useMutation({
    mutationFn: async (lawData: typeof newLawData) => {
      if (!lawData.law_identifier || !lawData.law_full_name) {
        throw new Error('Lov-identifikator og lovens fulle navn er påkrevd');
      }

      // Check if law already exists
      const { data: existing } = await supabase
        .from('legal_provisions')
        .select('law_identifier')
        .eq('law_identifier', lawData.law_identifier)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('En lov med denne identifikatoren eksisterer allerede');
      }

      return {
        id: lawData.law_identifier,
        law_identifier: lawData.law_identifier,
        law_full_name: lawData.law_full_name,
        description: lawData.description
      } as LawInfo;
    },
    onSuccess: (law) => {
      toast.success('Ny lov opprettet');
      setSelectedLaw(law);
      setCurrentStep(2);
      setNewLawData({ law_identifier: '', law_full_name: '', description: '' });
    },
    onError: (error: Error) => {
      toast.error(`Feil ved opprettelse av lov: ${error.message}`);
    }
  });

  const handleCreateLaw = () => {
    setIsCreatingLaw(true);
    createLawMutation.mutate(newLawData, {
      onSettled: () => setIsCreatingLaw(false)
    });
  };

  const handleLawSelection = (law: LawInfo) => {
    setSelectedLaw(law);
    setCurrentStep(2);
  };

  const handleExcelFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLaw) return;

    try {
      setIsImporting(true);
      const result = await LawSpecificExcelService.parseLawStructureExcel(file, selectedLaw.law_identifier);
      setImportResult(result);
      
      if (result.errors.length > 0) {
        toast.error(`Parsing med ${result.errors.length} feil. Se detaljer nedenfor.`);
      } else {
        toast.success(`Excel-fil parsert: ${result.chapters.length} kapitler, ${result.provisions.length} paragrafer`);
        setCurrentStep(3);
      }
    } catch (error) {
      toast.error(`Feil ved parsing av Excel-fil: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFinalImport = async () => {
    if (!importResult || !selectedLaw) return;

    try {
      setIsProcessing(true);
      
      // Import chapters first, then provisions
      for (const chapter of importResult.chapters) {
        const { error } = await supabase
          .from('legal_provisions')
          .insert({
            id: chapter.id,
            provision_type: chapter.provision_type!,
            provision_number: chapter.provision_number!,
            title: chapter.title!,
            content: chapter.content,
            hierarchy_path: chapter.hierarchy_path,
            sort_order: chapter.sort_order!,
            law_identifier: selectedLaw.law_identifier,
            law_full_name: selectedLaw.law_full_name,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }

      // Import provisions with proper hierarchy
      for (const provision of importResult.provisions) {
        const { error } = await supabase
          .from('legal_provisions')
          .insert({
            id: provision.id,
            provision_type: provision.provision_type!,
            provision_number: provision.provision_number!,
            title: provision.title!,
            content: provision.content,
            parent_provision_id: provision.parent_provision_id,
            hierarchy_path: provision.hierarchy_path,
            sort_order: provision.sort_order!,
            law_identifier: selectedLaw.law_identifier,
            law_full_name: selectedLaw.law_full_name,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['legal-provisions'] });
      queryClient.invalidateQueries({ queryKey: ['existing-laws'] });
      
      toast.success(`${selectedLaw.law_full_name} importert!`);
      
      // Reset wizard
      setCurrentStep(1);
      setSelectedLaw(null);
      setImportResult(null);
      
      // Go back to main view if callback provided
      if (onBack) {
        onBack();
      }
    } catch (error) {
      toast.error(`Feil ved import: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    if (!selectedLaw) return;
    LawSpecificExcelService.downloadTemplate(selectedLaw.law_identifier, selectedLaw.law_full_name);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {WIZARD_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step.id 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
          </div>
          <div className="ml-2 mr-4">
            <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.title}
            </div>
            <div className="text-xs text-muted-foreground">{step.description}</div>
          </div>
          {index < WIZARD_STEPS.length - 1 && (
            <div className={`w-8 h-0.5 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Eksisterende lover</CardTitle>
          <p className="text-sm text-muted-foreground">
            Velg en lov som allerede er registrert i systemet
          </p>
        </CardHeader>
        <CardContent>
          {lawsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Henter eksisterende lover...
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {existingLaws?.map((law) => (
                  <div
                    key={law.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleLawSelection(law)}
                  >
                    <div>
                      <div className="font-medium">{law.law_full_name}</div>
                      <div className="text-sm text-muted-foreground">{law.law_identifier}</div>
                    </div>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opprett ny lov</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registrer en helt ny lov i systemet
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Lov-identifikator *</label>
            <Input
              placeholder="f.eks. regnskapsloven, revisorloven"
              value={newLawData.law_identifier}
              onChange={(e) => setNewLawData({ ...newLawData, law_identifier: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kort identifikator uten mellomrom
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Lovens fulle navn *</label>
            <Input
              placeholder="f.eks. Lov om årsregnskap m.v."
              value={newLawData.law_full_name}
              onChange={(e) => setNewLawData({ ...newLawData, law_full_name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Beskrivelse</label>
            <Textarea
              placeholder="Kort beskrivelse av loven og dens formål"
              value={newLawData.description}
              onChange={(e) => setNewLawData({ ...newLawData, description: e.target.value })}
              rows={3}
            />
          </div>
          
          <Button 
            onClick={handleCreateLaw}
            disabled={!newLawData.law_identifier || !newLawData.law_full_name || isCreatingLaw}
            className="w-full"
          >
            {isCreatingLaw ? 'Oppretter...' : 'Opprett lov og fortsett'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {selectedLaw?.law_full_name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Last opp struktur for {selectedLaw?.law_identifier}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Last ned template for {selectedLaw?.law_identifier}
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileUpload}
                className="hidden"
                id="law-excel-upload"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('law-excel-upload')?.click()}
                disabled={isImporting}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isImporting ? 'Parser...' : 'Last opp Excel-fil'}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Instruksjoner:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Last ned Excel-templaten for valgt lov</li>
              <li>Fyll ut "Kapitler" og "Paragrafer" fanene</li>
              <li>Last opp den utfylte filen</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import klar for {selectedLaw?.law_full_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.chapters.length}
                </div>
                <div className="text-sm text-muted-foreground">Kapitler</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.provisions.length}
                </div>
                <div className="text-sm text-muted-foreground">Paragrafer</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <h5 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Feil som må rettes ({importResult.errors.length}):
                </h5>
                <ScrollArea className="h-32">
                  {importResult.errors.map((error, i) => (
                    <div key={i} className="text-sm text-red-700">{error}</div>
                  ))}
                </ScrollArea>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbake
              </Button>
              
              <Button 
                onClick={handleFinalImport}
                disabled={isProcessing || importResult.errors.length > 0}
                className="flex-1"
              >
                {isProcessing ? 'Importerer...' : `Importer ${selectedLaw?.law_full_name}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake til hovedvisning
            </Button>
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">Guidet Lov-opplastning</h1>
        <p className="text-muted-foreground">
          Forenklet prosess for å laste opp juridiske dokumenter lov for lov
        </p>
      </div>

      {renderStepIndicator()}

      <div className="min-h-96">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};