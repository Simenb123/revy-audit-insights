import { getSupabase } from "../_shared/supabaseClient.ts";
import { callOpenAI } from "../_shared/openai.ts";
import { log } from "../_shared/log.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, variantName, clientData, clientDocuments } = await req.json();
    
    log(`💬 [REVY-AI-CHAT] Processing message: "${message.substring(0, 100)}..."`);
    log(`🔍 [REVY-AI-CHAT] Context: ${context}, Variant: ${variantName}`);
    
    const supabase = getSupabase(req);
    
    // Enhanced knowledge search with timeout and better error handling
    let knowledgeArticles = [];
    try {
      const { data: knowledgeData, error: knowledgeError } = await Promise.race([
        supabase.functions.invoke('knowledge-search', {
          body: { query: message, matchThreshold: 0.3, matchCount: 5 }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Knowledge search timeout')), 5000))
      ]);
      
      if (knowledgeError) {
        log(`⚠️ [REVY-AI-CHAT] Knowledge search error: ${knowledgeError.message}`);
      } else if (knowledgeData?.matches) {
        knowledgeArticles = knowledgeData.matches;
        log(`📚 [REVY-AI-CHAT] Found ${knowledgeArticles.length} relevant knowledge articles`);
      }
    } catch (error) {
      log(`⚠️ [REVY-AI-CHAT] Knowledge search failed: ${error.message}`);
    }

    // Enhanced document context formatting
    let documentsContext = '';
    if (clientDocuments && clientDocuments.length > 0) {
      const readableDocuments = clientDocuments.filter(doc => 
        doc.extracted_text && 
        doc.extracted_text.length > 50 &&
        doc.text_extraction_status === 'completed' &&
        !isProbablyPDFMetadata(doc.extracted_text)
      );
      
      log(`📄 [REVY-AI-CHAT] Processing ${readableDocuments.length}/${clientDocuments.length} readable documents`);
      
      if (readableDocuments.length > 0) {
        documentsContext = `TILGJENGELIGE KLIENTDOKUMENTER (${readableDocuments.length} av ${clientDocuments.length} kan leses):\n\n${readableDocuments.map(doc => {
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

    // Enhanced system prompt with better document handling and guidance
    const systemPrompt = `Du er AI-Revy, en intelligent revisjonsassistent for norske revisorer.

KONTEKST: ${context}
VARIANT: ${variantName || 'standard'}
${clientData ? `KLIENT: ${clientData.company_name || 'Ukjent'} (${clientData.org_number || 'Ikke spesifisert'})` : ''}

${documentsContext}

${knowledgeArticles.length > 0 ? `RELEVANT FAGKUNNSKAP:\n${knowledgeArticles.map(article => 
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

    const data = await callOpenAI('chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const response = data.choices[0].message.content;
    
    log(`✅ [REVY-AI-CHAT] Response generated (${response.length} chars)`);

    return new Response(JSON.stringify({ 
      response,
      knowledgeReferences: knowledgeArticles.length,
      knowledgeArticles: knowledgeArticles.slice(0, 3) // Return top 3 for reference
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log(`❌ [REVY-AI-CHAT] Error: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      error: 'Kunne ikke behandle forespørselen',
      details: error.message,
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