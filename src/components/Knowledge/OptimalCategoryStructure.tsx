
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, FileText, Gavel, Calculator, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

const OptimalCategoryStructure = () => {
  const queryClient = useQueryClient();

  const optimalStructure = {
    "ISA Standarder": {
      icon: "📋",
      description: "Alle internasjonale revisjonstandarder",
      children: {
        "ISA 200-299 - Generelle prinsipper": {
          description: "Grunnleggende revisjonskonserter og ansvar",
          items: ["ISA 200 - Overordnede målsettinger", "ISA 210 - Engasjement", "ISA 220 - Kvalitetskontroll", "ISA 230 - Dokumentasjon", "ISA 240 - Misligheter", "ISA 250 - Lovregulering", "ISA 260 - Kommunikasjon", "ISA 265 - Kontrollmangler"]
        },
        "ISA 300-399 - Risikovurdering": {
          description: "Planlegging og risikovurdering",
          items: ["ISA 300 - Planlegging", "ISA 315 - Risikoidentifisering", "ISA 320 - Vesentlighet", "ISA 330 - Responshandlinger"]
        },
        "ISA 400-499 - Internkontroll": {
          description: "Vurdering av internkontroll",
          items: ["ISA 402 - Revisjonsoverveielser", "ISA 450 - Vurdering av feil"]
        },
        "ISA 500-599 - Revisjonsbevis": {
          description: "Innhenting av revisjonsbevis",
          items: ["ISA 500 - Revisjonsbevis", "ISA 501 - Spesifikke elementer", "ISA 505 - Eksterne bekreftelser", "ISA 510 - Første gangs engasjement", "ISA 520 - Analytiske handlinger", "ISA 530 - Utvalgsrevision", "ISA 540 - Regnskapsestimater", "ISA 550 - Nærstående parter", "ISA 560 - Hendelser etter balansedagen", "ISA 570 - Fortsatt drift", "ISA 580 - Skriftlige bekreftelser"]
        },
        "ISA 600-699 - Spesielle forhold": {
          description: "Konsernrevisjon og spesielle situasjoner",
          items: ["ISA 600 - Konsernrevisjon", "ISA 610 - Internrevisjon", "ISA 620 - Eksperters arbeid"]
        },
        "ISA 700-799 - Konklusjoner": {
          description: "Konklusjoner og rapportering",
          items: ["ISA 700 - Revisjonsberetning", "ISA 701 - Sentrale revisjonsforhold", "ISA 705 - Modifikasjoner", "ISA 706 - Tilleggsopplysninger", "ISA 710 - Sammenligningsopplysninger", "ISA 720 - Annen informasjon"]
        },
        "ISA 800-899 - Spesielle rapporter": {
          description: "Spesielle revisjonsoppdrag",
          items: ["ISA 800 - Spesielle hensyn", "ISA 805 - Enkeltregnskapsposter", "ISA 810 - Sammendrag"]
        }
      }
    },
    "Revisjonsmetodikk": {
      icon: "🔍",
      description: "Praktiske revisjonsmetoder og -teknikker",
      children: {
        "Risikobasert revisjon": {
          description: "Risikovurdering og -håndtering",
          items: ["Risikoidentifisering", "Risikovurdering", "Responsstrategier", "Overvåking"]
        },
        "Analytiske handlinger": {
          description: "Analytiske revisjonsteknikker",
          items: ["Forventningstester", "Regresjonsanalyse", "Forholdstallsanalyse", "Trendanalyse"]
        },
        "Utvalgsrevision": {
          description: "Statistiske utvalgsmetoder",
          items: ["Statistisk utvalg", "Ikke-statistisk utvalg", "Feilprosjeksjon", "Resultatvurdering"]
        },
        "Dataanalyse": {
          description: "Digitale revisjonsverktøy",
          items: ["CAATs", "Dataanalyseteknikker", "Kontinuerlig revisjon", "IT-revisjon"]
        }
      }
    },
    "Fagområder": {
      icon: "📚",
      description: "Spesialiserte revisjonsområder",
      children: {
        "Finansiell rapportering": {
          description: "Regnskapsstandarder og -praksis",
          items: ["NGAAP", "IFRS", "God regnskapsskikk", "Estimater og vurderinger"]
        },
        "IT-revisjon": {
          description: "Revisjon av IT-systemer og -kontroller",
          items: ["IT-kontroller", "Systemsikkerhet", "Datainnsynet", "Automatiserte kontroller"]
        },
        "Bærekraftsrapportering": {
          description: "ESG og bærekraftsrevisjon",
          items: ["ESG-rapportering", "Klimaregnskap", "CSRD", "Assurance på bærekraft"]
        },
        "Små foretak": {
          description: "Revisjon av små og mellomstore foretak",
          items: ["Forenklet revisjon", "SME-veiledning", "Proporsjonalitet", "Kostnadseffektivitet"]
        }
      }
    },
    "Lovgivning og regelverk": {
      icon: "⚖️",
      description: "Juridiske rammer for revisjon",
      children: {
        "Revisorloven": {
          description: "Norsk revisorlovgivning",
          items: ["Revisorlovens krav", "Etiske regler", "Uavhengighet", "Taushetsplikt"]
        },
        "Regnskapsloven": {
          description: "Regnskapsrettslige bestemmelser",
          items: ["Regnskapsloven", "Regnskapsforskriften", "God regnskapsskikk", "Årsregnskapet"]
        },
        "EU-regelverk": {
          description: "Europeiske direktiver og forordninger",
          items: ["Revisjonsforordningen", "Revisjonstilsynsdirektivet", "CSRD", "Taksonomi"]
        }
      }
    },
    "Kvalitetskontroll": {
      icon: "🎯",
      description: "Kvalitetssikring av revisjonstjenester",
      children: {
        "ISQM": {
          description: "International Standards on Quality Management",
          items: ["ISQM 1", "ISQM 2", "Kvalitetsmålsettinger", "Overvåkning"]
        },
        "Intern kvalitetskontroll": {
          description: "Firmaets kvalitetssystemer",
          items: ["Kvalitetsmanualer", "Gjennomgang av engasjement", "Konsultasjon", "Overvåkning"]
        },
        "Tilsyn og kontroll": {
          description: "Ekstern overvåkning",
          items: ["Finanstilsynets kontroll", "Revisortilsynet", "Klagebehandling", "Sanksjoner"]
        }
      }
    },
    "Etikk og uavhengighet": {
      icon: "🛡️",
      description: "Etiske retningslinjer og uavhengighetskrav",
      children: {
        "IESBA Code": {
          description: "International Ethics Standards Board for Accountants",
          items: ["Grunnleggende prinsipper", "Trusler og sikringstiltak", "Uavhengighet", "Ikke-attest tjenester"]
        },
        "Norske etiske regler": {
          description: "Nasjonale etikkstandarder",
          items: ["Den norske Revisorforenings regler", "Uavhengighetskrav", "Økonomiske interesser", "Familieforhold"]
        }
      }
    }
  };

  const createOptimalStructureMutation = useMutation({
    mutationFn: async () => {
      toast.info('Starter implementering av optimal struktur...');
      
      // First, get existing categories to avoid duplicates
      const { data: existingCategories } = await supabase
        .from('knowledge_categories')
        .select('*');
      
      const existingNames = new Set(existingCategories?.map(c => c.name) || []);
      
      let order = 100; // Start with high number to avoid conflicts
      
      for (const [mainCategoryName, mainCategoryData] of Object.entries(optimalStructure)) {
        // Skip if main category already exists
        if (existingNames.has(mainCategoryName)) {
          console.log(`Hopper over eksisterende hovedkategori: ${mainCategoryName}`);
          continue;
        }
        
        // Create main category
        const { data: mainCategory, error: mainError } = await supabase
          .from('knowledge_categories')
          .insert({
            name: mainCategoryName,
            description: mainCategoryData.description,
            icon: mainCategoryData.icon,
            display_order: order++,
            parent_category_id: null
          })
          .select()
          .single();
        
        if (mainError) {
          console.error('Feil ved opprettelse av hovedkategori:', mainError);
          continue;
        }
        
        let subOrder = 0;
        
        // Create subcategories
        for (const [subCategoryName, subCategoryData] of Object.entries(mainCategoryData.children)) {
          // Skip if subcategory already exists
          if (existingNames.has(subCategoryName)) {
            console.log(`Hopper over eksisterende underkategori: ${subCategoryName}`);
            continue;
          }
          
          const { data: subCategory, error: subError } = await supabase
            .from('knowledge_categories')
            .insert({
              name: subCategoryName,
              description: subCategoryData.description,
              display_order: subOrder++,
              parent_category_id: mainCategory.id
            })
            .select()
            .single();
          
          if (subError) {
            console.error('Feil ved opprettelse av underkategori:', subError);
            continue;
          }
          
          // Create individual item categories if needed
          let itemOrder = 0;
          for (const item of subCategoryData.items) {
            // Skip if item already exists
            if (existingNames.has(item)) {
              console.log(`Hopper over eksisterende element: ${item}`);
              continue;
            }
            
            await supabase
              .from('knowledge_categories')
              .insert({
                name: item,
                display_order: itemOrder++,
                parent_category_id: subCategory.id
              });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Optimal kategoristruktur implementert! Eksisterende kategorier ble bevart.');
    },
    onError: (error) => {
      console.error('Implementeringsfeil:', error);
      toast.error(`Feil ved implementering: ${error.message}`);
    }
  });

  const renderStructurePreview = (structure: any, level = 0) => {
    return Object.entries(structure).map(([name, data]: [string, any]) => (
      <div key={name} className={`ml-${level * 4} mb-2`}>
        <div className="flex items-center gap-2 p-2 bg-muted rounded">
          {data.icon && <span>{data.icon}</span>}
          <span className="font-medium">{name}</span>
          {data.description && (
            <span className="text-sm text-muted-foreground">- {data.description}</span>
          )}
        </div>
        {data.children && renderStructurePreview(data.children, level + 1)}
        {data.items && (
          <div className={`ml-${(level + 1) * 4} mt-1`}>
            <div className="flex flex-wrap gap-1">
              {data.items.map((item: string) => (
                <Badge key={item} variant="outline" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Foreslått optimal kategoristruktur</span>
            <Button 
              onClick={() => createOptimalStructureMutation.mutate()}
              disabled={createOptimalStructureMutation.isPending}
            >
              {createOptimalStructureMutation.isPending ? 'Implementerer...' : 'Implementer struktur'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Fordeler for AI-Revy:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Konsistent hierarkisk struktur gjør søk mer presist</li>
                <li>• ISA-nummerering i tags gjør det enkelt å finne spesifikke standarder</li>
                <li>• Tydelig skille mellom standarder, metodikk og praksis</li>
                <li>• Bedre kontekstforståelse for anbefalinger</li>
                <li>• Enklere å finne relaterte artikler og emner</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Implementeringsdetaljer:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Eksisterende kategorier bevares (ingen data går tapt)</li>
                <li>• Nye kategorier får høye sorteringsnumre for å unngå konflikter</li>
                <li>• Duplikater hoppes over automatisk</li>
                <li>• ISA-standarder organiseres i logiske grupper</li>
                <li>• Hierarkisk struktur med 3 nivåer: Hovedområde → Underområde → Spesifikk standard</li>
              </ul>
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
              {renderStructurePreview(optimalStructure)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimalCategoryStructure;
