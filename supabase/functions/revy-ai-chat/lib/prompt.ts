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

// Intelligent system prompt building
export function buildIntelligentSystemPrompt(
  context: string, 
  clientData: any, 
  userRole: string,
  enhancedContext: any,
  isGuestMode = false
): string {
  let basePrompt = `Du er AI-Revy, en ekspert AI-revisjonsassistent for norske revisorer. Du har dyp kunnskap om:
- Norsk regnskapslovgivning og standarder (Regnskapsloven, NGRS, IFRS)
- ISA (International Standards on Auditing) - alle standarder
- Risikovurdering og revisjonsmetodikk
- Regnskapsanalyse og kontroller
- Norsk skatterett og MVA-regelverket
- Revisorlovgivning og etiske regler
- Praktisk revisjonsarbeid og dokumentasjon

Du kommuniserer alltid på norsk og er vennlig, profesjonell og præsis. Dine svar skal være konkrete og handlingsrettede.

VIKTIG: Du har tilgang til en omfattende kunnskapsbase med artikler om revisjon, ISA-standarder, regnskapslovgivning og praksis. Når brukere spør om faglige temaer, søker du aktivt i kunnskapsbasen og referer til relevante artikler.`;

  if (isGuestMode) {
    basePrompt += `\n\nVIKTIG: Brukeren er i gjestmodus og har begrenset tilgang. Gi generelle råd og veiledning, men nevn at full funksjonalitet krever innlogging. Hold svarene enkle og praktiske.`;
  }

  let contextPrompt = '';
  let knowledgePrompt = '';
  let clientPrompt = '';
  let proactivePrompt = '';

  // Add enhanced knowledge context
  if (enhancedContext.knowledge && enhancedContext.knowledge.length > 0) {
    knowledgePrompt = `\n\nHER ER RELEVANT FAGSTOFF FRA KUNNSKAPSBASEN. BRUK DETTE AKTIVT I SVARET DITT:\n\n`;
    enhancedContext.knowledge.forEach((article: any, index: number) => {
      knowledgePrompt += `ARTIKKEL ${index + 1}: "${article.title}"\n`;
      if (article.reference_code) {
        knowledgePrompt += `REFERANSE: ${article.reference_code}\n`;
      }
      knowledgePrompt += `SAMMENDRAG: ${article.summary || (article.content || '').substring(0, 300) + '...'}\n`;
      knowledgePrompt += `INNHOLD: ${article.content.substring(0, 1500)}${article.content.length > 1500 ? '...' : ''}\n`;
      knowledgePrompt += `LENKE: /fag/artikkel/${article.slug}\n\n`;
    });
    knowledgePrompt += `INSTRUKS: Du MÅ basere svaret ditt på disse artiklene når de er relevante. Referer direkte til artiklene, f.eks. "I artikkelen om '${enhancedContext.knowledge[0]?.title}' står det at...". Gi konkrete svar basert på fagstoffet.`;
  } else {
    knowledgePrompt = `\n\nINFO: Ingen spesifikke artikler ble funnet i kunnskapsbasen for dette spørsmålet. Jeg svarer basert på min generelle revisjonskunnskap. Prøv å være mer spesifikk i spørsmålet ditt for å få tilgang til relevante fagartikler.`;
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

  // Enhanced context-specific prompts with workflow integration
  const contextPrompts = {
    'risk-assessment': `\nDu hjelper med risikovurdering. Fokuser på:
- Systematisk identifisering av risikoområder per ISA 315
- Vurdering av iboende risiko, kontrollrisiko og oppdagelsesrisiko
- Forslag til risikoreduserende tiltak og kontroller
- ISA 330 og utforming av risikoresponser
- Materialitetsvurderinger og terskelverdi-setting
- Proaktive anbefalinger basert på bransje og klientstørrelse`,

    'documentation': `\nDu hjelper med dokumentasjon. Fokuser på:
- Krav til revisjonsdokumentasjon per ISA 230
- Strukturering av arbeidspapirer og elektronisk arkivering
- Konklusjoner og faglige vurderinger
- Forberedelse til partner review og kvalitetskontroll
- Dokumentasjon av vesentlige forhold og unntak
- Automatisk kvalitetskontroll og missing elements`,

    'client-detail': `\nDu hjelper med klientanalyse. Fokuser på:
- Dypere risikovurderinger for denne spesifikke klienten
- Detaljerte forslag til revisjonshandlinger basert på bransje og størrelse
- Analyse av regnskapsdata og nøkkeltall
- Spesifikke dokumentasjonskrav og kontroller
- Planlegging av feltarbeid og tidsestimater
- Sammenligning med bransjegjennomsnitt og tidligere perioder`,

    'collaboration': `\nDu hjelper med samarbeid og teamarbeid. Fokuser på:
- Organisering av team og fordeling av arbeidsoppgaver
- Effektiv kommunikasjon og koordinering av revisjonsarbeid
- Kvalitetssikring og review-prosesser
- Tidsplanlegging, ressursfordeling og budsjettering
- Håndtering av teammøter og oppfølging
- Konfliktløsning og teamdynamikk`
  };

  contextPrompt = contextPrompts[context as keyof typeof contextPrompts] || `\nDu kan hjelpe med alle aspekter av revisjonsarbeid:
- Planlegging og gjennomføring av revisjoner per ISA-standarder
- Risikovurderinger og testing av kontroller
- Regnskapsanalyse og substansielle handlinger
- Dokumentasjon, rapportering og oppfølging
- Praktiske utfordringer i revisjonsarbeid`;

  const roleContext = isGuestMode
    ? '\nBrukeren er gjest og har begrenset tilgang. Gi generelle, praktiske råd om revisjonsarbeid uten tilgang til spesifikke klientdata.'
    : userRole === 'partner' 
    ? '\nBrukeren er partner og trenger høynivå strategisk veiledning om klientportefølje, risikostyring og forretningsutvikling. Fokuser på ledelsesperspektiv og beslutningsstøtte.'
    : userRole === 'manager'
    ? '\nBrukeren er manager og fokuserer på prosjektledelse, kvalitetssikring og teamkoordinering. Gi praktiske ledelses- og koordineringsråd.'
    : '\nBrukeren er revisor og trenger praktisk, detaljert veiledning i daglig revisjonsarbeid og tekniske spørsmål. Fokuser på håndverk og implementering.';

  return `${basePrompt}${knowledgePrompt}${clientPrompt}${proactivePrompt}${contextPrompt}${roleContext}

VIKTIG: Gi alltid konkrete, handlingsrettede råd. Referer til relevante ISA-standarder når det er aktuelt. Hold svarene fokuserte og praktiske. ${isGuestMode ? 'Nevn gjerne at innlogging gir tilgang til mer avanserte funksjoner.' : 'Vær proaktiv med forslag basert på klientdata og kontekst. Når du bruker kunnskap fra kunnskapsbasen, referer alltid til spesifikke artikler.'}`;
}
