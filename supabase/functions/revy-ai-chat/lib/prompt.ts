// Proactive insights based on client data
function buildProactiveInsights(client: any): string {
  let insights = '\n\nProaktive innsikter:\n';
  
  // Progress-based insights
  if (client.progress < 25) {
    insights += '- Klienten er i tidlig fase. Fokuser på planlegging og risikovurdering.\n';
  } else if (client.progress > 75) {
    insights += '- Klienten nærmer seg ferdigstillelse. Fokuser på avslutning og konklusjoner.\n';
  }
  
  // Risk-based insights
  const highRiskAreas = client.risk_areas?.filter((r: any) => r.risk === 'high') || [];
  if (highRiskAreas.length > 0) {
    insights += `- HØYRISIKO: ${highRiskAreas.map((r: any) => r.name).join(', ')} krever ekstra oppmerksomhet.\n`;
  }
  
  // Industry-specific insights
  if (client.industry) {
    const industryInsights = {
      'Bygg og anlegg': 'Vær oppmerksom på prosjektregnskapsføring og WIP-vurderinger.',
      'Handel': 'Fokuser på lagerverdsettelse og kundefordringer.',
      'Teknologi': 'Vurder immaterielle eiendeler og utviklingskostnader.',
      'Finans': 'Særlig oppmerksomhet på regulatoriske krav og risikostyring.'
    };
    
    const insight = industryInsights[client.industry as keyof typeof industryInsights];
    if (insight) {
      insights += `- Bransje-spesifikt: ${insight}\n`;
    }
  }
  
  // Overdue actions
  const overdueActions = client.client_audit_actions?.filter((action: any) => 
    action.due_date && new Date(action.due_date) < new Date() && action.status !== 'completed'
  ) || [];
  
  if (overdueActions.length > 0) {
    insights += `- FORSINKELSE: ${overdueActions.length} forfalt(e) oppgave(r) krever umiddelbar oppmerksomhet.\n`;
  }
  
  return insights;
}

// Enhanced intelligent system prompt building with database integration
export async function buildIntelligentSystemPrompt(
  context: string, 
  clientData: any, 
  userRole: string,
  enhancedContext: any,
  isGuestMode = false
): Promise<string> {
  
  // Load the latest prompt configuration from database
  const { basePrompt, contextPrompts } = await getLatestPromptConfiguration();
  
  let systemPrompt = basePrompt;

  if (isGuestMode) {
    systemPrompt += `\n\nVIKTIG: Brukeren er i gjestmodus og har begrenset tilgang. Gi generelle råd og veiledning, men nevn at full funksjonalitet krever innlogging. Hold svarene enkle og praktiske.`;
  }

  let knowledgePrompt = '';
  let clientPrompt = '';
  let proactivePrompt = '';

  // Enhanced knowledge integration with active article promotion
  if (enhancedContext.knowledge && enhancedContext.knowledge.length > 0) {
    knowledgePrompt = `\n\n🎯 RELEVANT FAGSTOFF FRA KUNNSKAPSBASEN - BRUK DETTE AKTIVT:\n\n`;
    enhancedContext.knowledge.forEach((article: any, index: number) => {
      knowledgePrompt += `📚 ARTIKKEL ${index + 1}: "${article.title}"\n`;
      if (article.reference_code) {
        knowledgePrompt += `🔖 REFERANSE: ${article.reference_code}\n`;
      }
      if (article.tags && article.tags.length > 0) {
        knowledgePrompt += `🏷️ EMNER: ${article.tags.join(', ')}\n`;
      }
      knowledgePrompt += `📝 SAMMENDRAG: ${article.summary || (article.content || '').substring(0, 200) + '...'}\n`;
      knowledgePrompt += `📄 INNHOLD: ${article.content.substring(0, 1200)}${article.content.length > 1200 ? '...' : ''}\n`;
      knowledgePrompt += `🔗 LENKE: [Les hele artikkelen](/fag/artikkel/${article.slug})\n\n`;
    });
    
    knowledgePrompt += `\n🚨 KRITISKE INSTRUKSER FOR BRUK AV FAGARTIKLER:
1. Du MÅ referere til og sitere fra disse artiklene når de er relevante
2. Vis ALLTID lenker til artiklene i markdown-format: [Artikkeltittel](/fag/artikkel/slug)
3. Nevn spesifikke referansekoder (f.eks. ISA 315) når de finnes
4. Gi konkrete sitater fra artiklene med "..." rundt
5. Hvis artikler har tags, nevn dem som relevante emner
6. Strukturer svaret med tydelige referanser til fagstoffet
7. Start gjerne svaret med "Basert på vårt fagstoff om..." når relevant

EKSEMPEL PÅ GODT SVAR:
"Basert på vår artikkel om [ISA 315 - Risikovurdering](/fag/artikkel/isa-315-risikovurdering) kan jeg hjelpe deg med dette. Som det står i standarden: 'Revisor skal...' 

📚 Relevante artikler:
- [Artikkeltittel 1](/fag/artikkel/slug1) - Referanse: ISA 315
- [Artikkeltittel 2](/fag/artikkel/slug2) - Emner: risikovurdering, materialitet"`;
  } else {
    knowledgePrompt = `\n\n⚠️ INGEN SPESIFIKKE ARTIKLER funnet for dette spørsmålet i kunnskapsbasen. 

INSTRUKSER NÅR INGEN ARTIKLER FINNES:
1. Nevn eksplisitt at du ikke fant spesifikke fagartikler for dette emnet
2. Oppfordre brukeren til å være mer spesifikk eller prøve andre søketermer
3. Foreslå relevante emner de kan søke på (f.eks. "ISA 315", "risikovurdering", "materialitet")
4. Gi likevel grundig faglig veiledning basert på din kunnskap
5. Avslutt med "💡 Tips: Prøv å søke på mer spesifikke fagtermer i chatten for å få tilgang til våre fagartikler"

Du kan fortsatt gi utmerket faglig råd basert på din ekspertise, men vær ærlig om at du ikke har funnet spesifikke artikler.`;
  }

  // Enhanced client context with proactive insights
  if (enhancedContext.clientContext) {
    const client = enhancedContext.clientContext;
    clientPrompt = `\n\nUtvidet klient-informasjon:\n`;
    clientPrompt += `Klient: ${client.company_name} (${client.org_number})\n`;
    clientPrompt += `Bransje: ${client.industry}\n`;
    clientPrompt += `Fase: ${client.phase}\n`;
    clientPrompt += `Fremgang: ${client.progress}%\n`;
    
    if (client.risk_areas && client.risk_areas.length > 0) {
      clientPrompt += `Risikoområder: ${client.risk_areas.map((r: any) => `${r.name} (${r.risk})`).join(', ')}\n`;
    }

    // Add proactive insights based on data
    proactivePrompt = buildProactiveInsights(client);
  }

  // Get context-specific prompt
  const contextPrompt = contextPrompts[context as keyof typeof contextPrompts] || contextPrompts.general;

  const roleContext = isGuestMode
    ? '\nBrukeren er gjest og har begrenset tilgang. Gi generelle, praktiske råd om revisjonsarbeid uten tilgang til spesifikke klientdata.'
    : userRole === 'partner' 
    ? '\nBrukeren er partner og trenger høynivå strategisk veiledning om klientportefølje, risikostyring og forretningsutvikling. Fokuser på ledelsesperspektiv og beslutningsstøtte.'
    : userRole === 'manager'
    ? '\nBrukeren er manager og fokuserer på prosjektledelse, kvalitetssikring og teamkoordinering. Gi praktiske ledelses- og koordineringsråd.'
    : '\nBrukeren er revisor og trenger praktisk, detaljert veiledning i daglig revisjonsarbeid og tekniske spørsmål. Fokuser på håndverk og implementering.';

  return `${systemPrompt}${knowledgePrompt}${clientPrompt}${proactivePrompt}\n\n${contextPrompt}${roleContext}

🔥 VIKTIG PÅMINNELSE: Du skal være PROAKTIV med å bruke fagartikler! Når brukere spør om faglige temaer:
1. Referer ALLTID til relevante artikler når de finnes
2. Vis tydelige lenker i markdown-format
3. Gi konkrete sitater og referanser
4. Nevn tags/emner fra artiklene
5. Oppfordre til videre lesing av hele artikler

${isGuestMode ? 'Nevn gjerne at innlogging gir tilgang til mer avanserte funksjoner.' : 'Vær proaktiv med artikkelbruk og faglige referanser. Gjør det enkelt for brukeren å finne og lese relevante fagartikler.'}`;
}
