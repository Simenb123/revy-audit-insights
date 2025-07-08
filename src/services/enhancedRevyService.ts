
export const getEnhancedContextualTips = async (
  context: string,
  clientData?: any,
  userRole?: string
): Promise<string> => {
  const tips = {
    documentation: [
      '💡 Tips: Bruk AI-Revy til å analysere dokumentkvalitet og identifisere mangler',
      '📋 Husk: Kategoriser dokumenter etter fagområde for bedre oversikt',
      '🔍 Sjekk: AI-konfidensscoren indikerer kvaliteten på automatisk kategorisering',
      '⚡ Effektivt: Bruk bulk-operasjoner for å behandle mange dokumenter samtidig',
      '📊 Analyse: AI-Revy kan foreslå revisjonshandlinger basert på opplastede dokumenter'
    ],
    'audit-actions': [
      '🎯 Planlegg: Start med risikovurdering før du velger revisjonshandlinger',
      '📖 ISA-standarder: AI-Revy kan hjelpe deg identifisere relevante standarder',
      '⏰ Tidsbruk: Estimer timer realistisk basert på kompleksitet',
      '✅ Kvalitet: Dokumenter alle funn og konklusjoner grundig',
      '🔄 Oppfølging: Planlegg kontrollaktiviteter for identifiserte risikoområder'
    ],
    'client-detail': [
      '🏢 Bransjeforståelse: Analyser bransjerisiko og spesielle forhold',
      '📈 Trender: Følg med på endringer i klientens virksomhet',
      '🎨 Tilpasning: Juster revisjonsstrategien til klientens størrelse og kompleksitet',
      '🤝 Kommunikasjon: Oppretthold god dialog med klientens ledelse',
      '⚖️ Vurdering: Evaluer intern kontroll og ledelsens integritet'
    ]
  };

  const contextTips = tips[context as keyof typeof tips] || [
    '💡 AI-Revy er her for å hjelpe deg med alle dine revisjonsbehov',
    '🚀 Utforsk ulike funksjoner for å effektivisere arbeidsflyten din'
  ];

  // Select tip based on client data or randomly
  let selectedTip = contextTips[Math.floor(Math.random() * contextTips.length)];

  // Customize tips based on client data
  if (clientData) {
    if (context === 'documentation' && clientData.documentContext) {
      const stats = clientData.documentContext.documentStats;
      if (stats.uncategorized > 0) {
        selectedTip = `📋 Du har ${stats.uncategorized} ukategoriserte dokumenter. AI-Revy kan hjelpe med automatisk kategorisering`;
      } else if (stats.qualityScore < 70) {
        selectedTip = '🔍 Noen dokumenter har lav AI-sikkerhet. Vurder manuell gjennomgang for bedre kvalitet';
      }
    }
    
    if (context === 'client-detail' && clientData.industry) {
      selectedTip = `🏢 Bransje: ${clientData.industry}. AI-Revy kan gi bransjetilpassede revisjonsråd`;
    }
  }

  return selectedTip;
};

export const getContextualSuggestions = (
  context: string,
  clientData?: any
): string[] => {
  const baseSuggestions = {
    documentation: [
      'Analyser dokumentkvaliteten for denne klienten',
      'Foreslå kategorier for ukategoriserte dokumenter',
      'Hvilke dokumenter mangler for en komplett revisjon?',
      'Gi en oversikt over dokumentstrukturen'
    ],
    'audit-actions': [
      'Foreslå revisjonshandlinger basert på risikovurdering',
      'Hvilke ISA-standarder er relevante for denne klienten?',
      'Hjelp meg prioritere revisjonshandlinger',
      'Estimer tidsbruk for planlagte handlinger'
    ],
    'client-detail': [
      'Analyser risikoområder for denne klienten',
      'Foreslå revisjonstilnærming basert på bransje',
      'Vurder materialitetsnivå og prøvetak',
      'Identifiser spesielle forhold å følge opp'
    ]
  };

  return baseSuggestions[context as keyof typeof baseSuggestions] || [
    'Hvordan kan jeg hjelpe deg i dag?',
    'Gi meg en oversikt over arbeidsoppgavene',
    'Hjelp meg med å prioritere arbeidet'
  ];
};
