import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, History, Copy } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

type ContextPrompts = {
  'risk-assessment': string;
  'documentation': string;
  'client-detail': string;
  'collaboration': string;
  'general': string;
};

const PromptEditor = () => {
  const [prompts, setPrompts] = useState({
    basePrompt: '',
    contextPrompts: {
      'risk-assessment': '',
      'documentation': '',
      'client-detail': '',
      'collaboration': '',
      'general': ''
    } as ContextPrompts
  });
  const [selectedContext, setSelectedContext] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentPrompts();
    loadPromptHistory();
  }, []);

  const loadCurrentPrompts = async () => {
    // Load the most recent prompt configuration
    try {
      const { data } = await supabase
        .from('ai_prompt_configurations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        // Safely cast the context_prompts with fallback
        const contextPrompts = data.context_prompts as ContextPrompts || {
          'risk-assessment': '',
          'documentation': '',
          'client-detail': '',
          'collaboration': '',
          'general': ''
        };

        setPrompts({
          basePrompt: data.base_prompt,
          contextPrompts
        });
      } else {
        // Set default prompts if none exist
        setPrompts({
          basePrompt: `Du er AI-Revy, en ekspert AI-revisjonsassistent for norske revisorer. Du har dyp kunnskap om:
- Norsk regnskapslovgivning og standarder (Regnskapsloven, NGRS, IFRS)
- ISA (International Standards on Auditing) - alle standarder
- Risikovurdering og revisjonsmetodikk
- Regnskapsanalyse og kontroller
- Norsk skatterett og MVA-regelverket
- Revisorlovgivning og etiske regler
- Praktisk revisjonsarbeid og dokumentasjon

Du kommuniserer alltid på norsk og er vennlig, profesjonell og præsis. Dine svar skal være konkrete og handlingsrettede.

VIKTIG: Du har tilgang til en omfattende kunnskapsbase med artikler om revisjon, ISA-standarder, regnskapslovgivning og praksis. Når brukere spør om faglige temaer, søker du aktivt i kunnskapsbasen og referer til relevante artikler.`,
          contextPrompts: {
            'risk-assessment': `Du hjelper med risikovurdering. Fokuser på:
- Systematisk identifisering av risikoområder per ISA 315
- Vurdering av iboende risiko, kontrollrisiko og oppdagelsesrisiko
- Forslag til risikoreduserende tiltak og kontroller
- ISA 330 og utforming av risikoresponser
- Materialitetsvurderinger og terskelverdi-setting
- Proaktive anbefalinger basert på bransje og klientstørrelse`,
            'documentation': `Du hjelper med dokumentasjon. Fokuser på:
- Krav til revisjonsdokumentasjon per ISA 230
- Strukturering av arbeidspapirer og elektronisk arkivering
- Konklusjoner og faglige vurderinger
- Forberedelse til partner review og kvalitetskontroll
- Dokumentasjon av vesentlige forhold og unntak
- Automatisk kvalitetskontroll og missing elements`,
            'client-detail': `Du hjelper med klientanalyse. Fokuser på:
- Dypere risikovurderinger for denne spesifikke klienten
- Detaljerte forslag til revisjonshandlinger basert på bransje og størrelse
- Analyse av regnskapsdata og nøkkeltall
- Spesifikke dokumentasjonskrav og kontroller
- Planlegging av feltarbeid og tidsestimater
- Sammenligning med bransjegjennomsnitt og tidligere perioder`,
            'collaboration': `Du hjelper med samarbeid og teamarbeid. Fokuser på:
- Organisering av team og fordeling av arbeidsoppgaver
- Effektiv kommunikasjon og koordinering av revisjonsarbeid
- Kvalitetssikring og review-prosesser
- Tidsplanlegging, ressursfordeling og budsjettering
- Håndtering av teammøter og oppfølging
- Konfliktløsning og teamdynamikk`,
            'general': `Du kan hjelpe med alle aspekter av revisjonsarbeid:
- Planlegging og gjennomføring av revisjoner per ISA-standarder
- Risikovurderinger og testing av kontroller
- Regnskapsanalyse og substansielle handlinger
- Dokumentasjon, rapportering og oppfølging
- Praktiske utfordringer i revisjonsarbeid`
          }
        });
      }
    } catch (error) {
      logger.error('Error loading prompts:', error);
    }
  };

  const loadPromptHistory = async () => {
    try {
      const { data } = await supabase
        .from('ai_prompt_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      setPromptHistory(data || []);
    } catch (error) {
      logger.error('Error loading prompt history:', error);
    }
  };

  const savePrompts = async () => {
    setIsLoading(true);
    try {
      // Save current configuration to history first
      const { data: currentConfig } = await supabase
        .from('ai_prompt_configurations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentConfig) {
        await supabase
          .from('ai_prompt_history')
          .insert({
            configuration_id: currentConfig.id,
            base_prompt: currentConfig.base_prompt,
            context_prompts: currentConfig.context_prompts,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          });
      }

      // Save new configuration
      const { error } = await supabase
        .from('ai_prompt_configurations')
        .insert({
          base_prompt: prompts.basePrompt,
          context_prompts: prompts.contextPrompts,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Prompts lagret",
        description: "Promptene er oppdatert og vil brukes i neste AI-samtale."
      });

      loadPromptHistory(); // Refresh history
    } catch (error) {
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre promptene. Prøv igjen.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewPrompt = () => {
    const fullPrompt = `${prompts.basePrompt}\n\n${prompts.contextPrompts[selectedContext as keyof typeof prompts.contextPrompts]}`;
    
    // Open preview in new tab/modal
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow?.document.write(`
      <html>
        <head><title>Prompt Preview</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Full System Prompt Preview</h2>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${fullPrompt}</div>
        </body>
      </html>
    `);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Editor</CardTitle>
          <CardDescription>
            Rediger systemprompter som styrer AI-Revys oppførsel og svar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="base" className="space-y-4">
            <TabsList>
              <TabsTrigger value="base">Base Prompt</TabsTrigger>
              <TabsTrigger value="context">Kontekst-prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="base" className="space-y-4">
              <div>
                <Label htmlFor="basePrompt">Base System Prompt</Label>
                <Textarea
                  id="basePrompt"
                  value={prompts.basePrompt}
                  onChange={(e) => setPrompts(prev => ({ ...prev, basePrompt: e.target.value }))}
                  rows={12}
                  className="mt-2"
                  placeholder="Skriv inn base system prompt..."
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Dette er grunnlaget for AI-Revys personlighet og kjernekompetanse.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="context" className="space-y-4">
              <div>
                <Label htmlFor="contextSelect">Velg kontekst</Label>
                <Select value={selectedContext} onValueChange={setSelectedContext}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Generell</SelectItem>
                    <SelectItem value="risk-assessment">Risikovurdering</SelectItem>
                    <SelectItem value="documentation">Dokumentasjon</SelectItem>
                    <SelectItem value="client-detail">Klientdetaljer</SelectItem>
                    <SelectItem value="collaboration">Samarbeid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contextPrompt">Kontekst-spesifikk prompt</Label>
                <Textarea
                  id="contextPrompt"
                  value={prompts.contextPrompts[selectedContext as keyof typeof prompts.contextPrompts]}
                  onChange={(e) => setPrompts(prev => ({
                    ...prev,
                    contextPrompts: {
                      ...prev.contextPrompts,
                      [selectedContext]: e.target.value
                    }
                  }))}
                  rows={8}
                  className="mt-2"
                  placeholder="Skriv inn kontekst-spesifikk instruksjoner..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button onClick={savePrompts} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Lagrer...' : 'Lagre prompts'}
            </Button>
            <Button variant="outline" onClick={previewPrompt}>
              <Eye className="h-4 w-4 mr-2" />
              Forhåndsvis
            </Button>
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Historikk
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Statistikk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{prompts.basePrompt.length}</div>
              <div className="text-sm text-muted-foreground">Tegn i base prompt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">5</div>
              <div className="text-sm text-muted-foreground">Kontekst-varianter</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{promptHistory.length}</div>
              <div className="text-sm text-muted-foreground">Versjoner i historikk</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptEditor;
