import { getSupabase } from "../_shared/supabaseClient.ts";
import { chatWithFallback } from "../_shared/openai.ts";
import { log } from "../_shared/log.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const { 
      message, 
      enhancedPrompt,
      context, 
      variantName, 
      clientData, 
      clientDocuments, 
      sessionId, 
      mode,
      enhancementApplied,
      recommendedVariant,
      contextAnalysis
    } = await req.json();
    
    log(`💬 [REVY-AI-CHAT] Processing message: "${message.substring(0, 100)}..."`);
    log(`🔍 [REVY-AI-CHAT] Context: ${context}, Variant: ${variantName}, Mode: ${mode || 'normal'}`);
    if (enhancementApplied) {
      log(`🚀 [REVY-AI-CHAT] Enhanced prompt processing activated`);
      log(`📊 [REVY-AI-CHAT] Context analysis: ${contextAnalysis ? 'Available' : 'Not available'}`);
      log(`🎯 [REVY-AI-CHAT] Recommended variant: ${recommendedVariant || 'None'}`);
    }
    
    const supabase = getSupabase(req);
    
    // Enhanced knowledge search with timeout and better error handling
    // Skip knowledge search in school mode as we use curated library instead
    let knowledgeArticles = [];
    let trainingContext = null;
    
    if (mode === 'school' && sessionId) {
      // Get training context for school mode
      try {
        log(`🎓 [REVY-AI-CHAT] Fetching training context for session: ${sessionId}`);
        const { data: contextData, error: contextError } = await supabase.functions.invoke('training-context', {
          body: { sessionId }
        });
        
        if (contextError) {
          log(`⚠️ [REVY-AI-CHAT] Training context error: ${contextError.message}`);
        } else {
          trainingContext = contextData;
          // Use library articles as knowledge source in school mode
          knowledgeArticles = contextData.library || [];
          log(`🎓 [REVY-AI-CHAT] Using ${knowledgeArticles.length} curated articles from training library`);
        }
      } catch (error) {
        log(`⚠️ [REVY-AI-CHAT] Training context failed: ${(error as Error).message}`);
      }
    } else {
      // Normal mode - use knowledge search
      try {
        const result = await Promise.race([
          supabase.functions.invoke('knowledge-search', {
            body: { query: message, matchThreshold: 0.3, matchCount: 5 }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Knowledge search timeout')), 5000))
        ]) as { data: any, error: any };
        
        const { data: knowledgeData, error: knowledgeError } = result;
        
        if (knowledgeError) {
          log(`⚠️ [REVY-AI-CHAT] Knowledge search error: ${knowledgeError.message}`);
        } else if (knowledgeData?.matches) {
          knowledgeArticles = knowledgeData.matches;
          log(`📚 [REVY-AI-CHAT] Found ${knowledgeArticles.length} relevant knowledge articles`);
        }
      } catch (error) {
        log(`⚠️ [REVY-AI-CHAT] Knowledge search failed: ${(error as Error).message}`);
      }
    }

    // Enhanced document context formatting
    let documentsContext = '';
    if (clientDocuments && clientDocuments.length > 0) {
      const readableDocuments = clientDocuments.filter((doc: any) => 
        doc.extracted_text && 
        doc.extracted_text.length > 50 &&
        doc.text_extraction_status === 'completed' &&
        !isProbablyPDFMetadata(doc.extracted_text)
      );
      
      log(`📄 [REVY-AI-CHAT] Processing ${readableDocuments.length}/${clientDocuments.length} readable documents`);
      
      if (readableDocuments.length > 0) {
        documentsContext = `TILGJENGELIGE KLIENTDOKUMENTER (${readableDocuments.length} av ${clientDocuments.length} kan leses):\n\n${readableDocuments.map((doc: any) => {
          const preview = cleanDocumentText(doc.extracted_text).substring(0, 400);
          const category = doc.ai_suggested_category || doc.category || 'Ukategorisert';
          const analysis = doc.ai_analysis_summary ? `\nAI-analyse: ${doc.ai_analysis_summary.substring(0, 200)}` : '';
          return `📄 **${doc.file_name}** (${category})${analysis}\nInnhold: ${preview}${doc.extracted_text.length > 400 ? '...' : ''}\n`;
        }).join('\n---\n')}\n`;
      } else {
        const unreadableCount = clientDocuments.length - readableDocuments.length;
        documentsContext = `KLIENTDOKUMENTER STATUS: ${clientDocuments.length} dokumenter lastet opp.
${unreadableCount > 0 ? `\n⚠️ ${unreadableCount} dokumenter kan ikke leses automatisk (sannsynligvis skannede PDF-er eller andre bildefiler).` : ''}
${readableDocuments.length === 0 ? '\n💡 For å gjøre dokumenter lesbare for AI, prøv å laste opp tekstbaserte PDF-er eller konverter skannede dokumenter til tekst først.' : ''}\n`;
      }
    }

    // Helper function to detect PDF metadata
    function isProbablyPDFMetadata(text: string): boolean {
      const metadataTerms = ['PDF obj', 'FlateDecode', 'Filter', 'Creator', 'Producer', 'ModDate'];
      const linesWithMetadata = text.split('\n').filter(line => 
        metadataTerms.some(term => line.includes(term))
      ).length;
      return linesWithMetadata > text.split('\n').length * 0.3; // If >30% of lines contain metadata
    }

    // Helper function to clean document text
    function cleanDocumentText(text: string): string {
      return text
        .replace(/PDF obj.*?endobj/gs, '') // Remove PDF objects
        .replace(/stream.*?endstream/gs, '') // Remove streams
        .replace(/[^\w\s\u00C0-\u017F\u0100-\u024F.,!?;:()\-]/g, ' ') // Keep only readable characters
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Enhanced system prompt with context awareness and intelligent optimization
    let systemPrompt = '';
    
    // Use enhanced prompt if available, otherwise build traditional prompt
    if (enhancedPrompt && enhancementApplied) {
      log(`🎯 [REVY-AI-CHAT] Using context-aware enhanced prompt (${enhancedPrompt.length} chars)`);
      systemPrompt = enhancedPrompt;
      
      // Add document context to enhanced prompt if available
      if (documentsContext) {
        systemPrompt += `\n\n${documentsContext}`;
      }
      
      // Add knowledge context to enhanced prompt
      if (knowledgeArticles.length > 0) {
        systemPrompt += `\n\nRELEVANT FAGKUNNSKAP:\n${knowledgeArticles.map((article: any) => 
          `📖 ${article.title}\n${article.summary || article.content.substring(0, 300)}...\n`
        ).join('\n')}\n`;
      }
    } else if (mode === 'school' && trainingContext) {
      // School mode system prompt
      systemPrompt = `Du er AI-Revy i SCHOOL-modus - en pedagogisk revisjonsassistent for treningssesjon "${trainingContext.session?.title}".

OPPGAVE: Hjelp studenten å lære praktisk revisjon gjennom scenariobasert øving.

PEDAGOGISK TILNÆRMING:
- Svar kort og konkret (maks 3-4 setninger)
- Knytt råd til relevante påstander (Gyldighet, Fullstendighet, Periodisering, Klassifisering, Nøyaktighet)
- Henvis til ISA-standarder når relevant
- Avslutt alltid med ett kontrollspørsmål og forslag til neste steg

${trainingContext.session ? `SESJON: ${trainingContext.session.title}
${trainingContext.session.summary ? 'Beskrivelse: ' + trainingContext.session.summary : ''}
${trainingContext.session.goals ? 'Læringsmål: ' + JSON.stringify(trainingContext.session.goals) : ''}` : ''}

${trainingContext.userChoices?.length > 0 ? `STUDENTENS HANDLINGER SÅ LANGT:
${trainingContext.userChoices.map((choice: any) => `- ${choice.action_code}: ${choice.revealed_key || choice.revealed_text_md}`).join('\n')}` : ''}

${knowledgeArticles.length > 0 ? `TILLATTE FAGARTIKLER (kun disse):
${knowledgeArticles.map((article: any) => 
  `📖 ${article.title}${article.reference_code ? ' (' + article.reference_code + ')' : ''}\n${article.summary || article.content?.substring(0, 200) || ''}...\n`
).join('\n')}` : ''}

HUSKER: 
- Bruk KUN informasjon fra tillatte fagartikler ovenfor
- Hvis spørsmålet går utenfor sesjonens omfang, veiledd studenten tilbake til sesjonens læringsmål
- Vær pedagogisk - spør hva studenten tenker før du gir fasit
- Knytt læring til praktiske revisjonshandlinger`;

    } else {
      // Normal mode system prompt
      systemPrompt = `Du er AI-Revy, en intelligent revisjonsassistent for norske revisorer.

KONTEKST: ${context}
VARIANT: ${variantName || 'standard'}
${clientData ? `KLIENT: ${clientData.company_name || 'Ukjent'} (${clientData.org_number || 'Ikke spesifisert'})` : ''}

${documentsContext}

${knowledgeArticles.length > 0 ? `RELEVANT FAGKUNNSKAP:\n${knowledgeArticles.map((article: any) => 
  `📖 ${article.title}\n${article.summary || article.content.substring(0, 300)}...\n`
).join('\n')}\n` : ''}

INSTRUKSJONER FOR DOKUMENTANALYSE:
- Analyser dokumenter grundig og referer til spesifikke detaljer
- Bruk filnavn når du siterer fra dokumenter
- Identifiser nøkkeltall, datoer og andre kritiske opplysninger
- Knytt dokumentinnhold til revisjonsrelevante standarder og prosedyrer
- Hvis dokumenter inneholder feil eller inkonsistenser, påpek dette tydelig

SVARMØNSTER FOR DOKUMENTSPØRSMÅL:
1. Start med å identifisere relevante dokumenter
2. Gi konkrete funn fra dokumentene
3. Analyser funnene i revisjonssammenheng
4. Foreslå oppfølgingshandlinger hvis nødvendig

EKSEMPLER PÅ GODE SVAR:
- "I dokumentet 'lønnsoppgave 2024 daglig leder_mpd.pdf' finner jeg følgende nøkkelopplysninger: [konkrete tall/data]"
- "Kontoutskriften fra skatteetaten viser [spesifikke transaksjoner], som bør kontrolleres mot [annet dokument]"
- "Basert på avstemmingsinformasjonen ser jeg følgende avvik: [konkrete avvik]"

VED PROBLEMER MED DOKUMENTLESING:
- Forklar at enkelte PDF-er kan være skannede bilder
- Foreslå tekstbaserte alternativer eller OCR-konvertering
- Gi konstruktive råd for bedre dokumenthåndtering

Vær alltid konkret, faglig korrekt og konstruktiv i dine svar. Kombiner dokumentinnsikt med fagkunnskap for best mulig rådgivning.`;
    }

    const data = await chatWithFallback({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      maxTokens: 1500,
      temperature: 0.7
    });

    const response = data.text;
    
    log(`✅ [REVY-AI-CHAT] Response generated (${response.length} chars)`);

    return new Response(JSON.stringify({ 
      response,
      knowledgeReferences: knowledgeArticles.length,
      knowledgeArticles: knowledgeArticles.slice(0, 3), // Return top 3 for reference
      hasKnowledgeReferences: knowledgeArticles.length > 0,
      enhancementApplied: enhancementApplied || false,
      contextAnalysisUsed: !!contextAnalysis,
      recommendedVariant: recommendedVariant,
      processingTime: Date.now() - startTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log(`❌ [REVY-AI-CHAT] Error: ${(error as Error).message}`);
    
    return new Response(JSON.stringify({ 
      error: 'Kunne ikke behandle forespørselen',
      details: (error as Error).message,
      response: `Beklager, jeg hadde problemer med å behandle forespørselen din. 

Dette kan skyldes:
• Tekniske problemer med AI-tjenesten
• For stor mengde data å prosessere
• Manglende tilgang til dokumenter

Prøv å:
• Forenkle spørsmålet ditt
• Spørre om ett dokument av gangen
• Være mer spesifikk i forespørselen

Eksempel: "Analyser lønnsoppgaven" i stedet for "Hva inneholder alle dokumentene?"`
    }), {
      status: 200, // Return 200 to avoid UI errors, but include error info
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});