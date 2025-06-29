
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, FileText, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistItem {
  id: number;
  description: string;
  applies: 'N' | 'E' | 'N+E';
  response?: string | null;
  comment?: string;
  options?: string[];
}

const checklistItems: ChecklistItem[] = [
  {
    id: 1,
    description: 'Uavhengighet & etikk bekreftet (egen og teamets)',
    applies: 'N+E'
  },
  {
    id: 2,
    description: 'Kompetanse / kapasitet til stede (rett bransje- og IT-kompetanse, realistisk timebudsjett)',
    applies: 'N+E'
  },
  {
    id: 3,
    description: 'Kundens integritet / omdømmerisiko vurdert',
    applies: 'N+E'
  },
  {
    id: 4,
    description: 'Finansielt rapporteringsrammeverk er akseptabelt',
    applies: 'N+E'
  },
  {
    id: 5,
    description: 'Rapporteringsrammeverk - velg standard',
    applies: 'N+E',
    options: [
      'NGAAP små foretak',
      'NGAAP mellomstore foretak',
      'NGAAP store foretak',
      'IFRS',
    ]
  },
  {
    id: 6,
    description: 'Ledelsen erkjenner ansvar for regnskap, internkontroll og tilgang til info (forhåndsbetingelser)',
    applies: 'N'
  },
  {
    id: 7,
    description: 'Kontakt med forrige revisor gjennomført og svar vurdert',
    applies: 'N'
  },
  {
    id: 8,
    description: 'Tidligere års regnskap + revisjonsberetning innhentet & gjennomgått',
    applies: 'N'
  },
  {
    id: 9,
    description: 'Kundetiltak (AML/KYC) fullført – reelle rettighetshavere, PEP-/sanksjonssøk, ID-verifisering',
    applies: 'N'
  },
  {
    id: 10,
    description: 'Engasjementsbrev utarbeidet og signert av ledelsen',
    applies: 'N'
  },
  {
    id: 11,
    description: 'Formell aksept / fortsettelse dokumentert (sign-off fra oppdragsansvarlig ± kvalitetskontrollør)',
    applies: 'N+E'
  }
];

interface EngagementChecklistProps {
  clientId: string;
  clientName: string;
}

const EngagementChecklist = ({ clientId, clientName }: EngagementChecklistProps) => {
  const [items, setItems] = useState<ChecklistItem[]>(checklistItems);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`engagementChecklist-${clientId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ChecklistItem[];
        setItems(parsed);
      } catch {
        // ignore parsing errors
      }
    }
  }, [clientId]);

  const getAppliesBadgeColor = (applies: string) => {
    switch (applies) {
      case 'N': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'E': return 'bg-green-100 text-green-800 border-green-200';
      case 'N+E': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAppliesLabel = (applies: string) => {
    switch (applies) {
      case 'N': return 'Ny klient';
      case 'E': return 'Eksisterende';
      case 'N+E': return 'Alle';
      default: return applies;
    }
  };

  const updateItem = (id: number, field: 'response' | 'comment', value: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const getCompletionProgress = () => {
    const answeredItems = items.filter(item => item.response);
    return (answeredItems.length / items.length) * 100;
  };

  const isAllCompleted = () => {
    return items.every(item => item.response);
  };

  const saveAssessment = async () => {
    setIsSaving(true);
    try {
      // Persist locally for now. Replace with Supabase save when available
      localStorage.setItem(
        `engagementChecklist-${clientId}`,
        JSON.stringify(items)
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSaved(new Date());
      toast({
        title: "Lagret",
        description: "Oppdragsvurderingen er lagret",
      });
    } catch (error) {
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre oppdragsvurderingen",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Oppdragsvurdering - {clientName}
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Kortfattet sjekkliste for oppdragsvurdering
            </p>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Fremdrift: {Math.round(getCompletionProgress())}%
              </div>
              <Progress value={getCompletionProgress()} className="w-32" />
              {isAllCompleted() && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Gjelder:</span>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              N = Ny revisjonsklient
            </Badge>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              E = Eksisterende klient
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              N+E = Begge
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Sjekkliste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="font-medium text-sm w-8">{item.id}</div>
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                  </div>
                  <Badge className={getAppliesBadgeColor(item.applies)}>
                    {getAppliesLabel(item.applies)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Svar</Label>
                    {item.options ? (
                      <Select
                        value={item.response || ''}
                        onValueChange={(value) => updateItem(item.id, 'response', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg" />
                        </SelectTrigger>
                        <SelectContent>
                          {item.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <RadioGroup
                        value={item.response || ''}
                        onValueChange={(value) => updateItem(item.id, 'response', value)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="JA" id={`ja-${item.id}`} />
                          <Label htmlFor={`ja-${item.id}`} className="text-green-700 font-medium">JA</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NEI" id={`nei-${item.id}`} />
                          <Label htmlFor={`nei-${item.id}`} className="text-red-700 font-medium">NEI</Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={`comment-${item.id}`} className="text-sm font-medium mb-2 block">
                      Kommentar
                    </Label>
                    <Textarea
                      id={`comment-${item.id}`}
                      placeholder="Legg til kommentar ved behov..."
                      value={item.comment || ''}
                      onChange={(e) => updateItem(item.id, 'comment', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {lastSaved && `Sist lagret: ${lastSaved.toLocaleTimeString()}`}
            </div>
            <div className="flex gap-2">
              {!isAllCompleted() && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Alle punkter må besvares</span>
                </div>
              )}
              <Button 
                onClick={saveAssessment} 
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Lagrer...' : 'Lagre vurdering'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EngagementChecklist;
