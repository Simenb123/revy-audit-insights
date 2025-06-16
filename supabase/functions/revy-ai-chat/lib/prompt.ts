
import { searchKnowledgeIntelligently } from './improved-knowledge.ts';

// Enhanced prompt building
export async function buildIntelligentSystemPrompt(
  context: string,
  clientData: any | null,
  userRole: string | null,
  enhancedContext: any,
  isGuestMode = false
): Promise<string> {
  console.log('🏗️ Building intelligent system prompt...');

  let prompt = `Du er AI-Revy, en hjelpsom AI-assistent som spesialiserer deg på revisjon og regnskap.
  Du skal hjelpe brukeren med å svare på spørsmål knyttet til revisjon, regnskap og økonomistyring.
  Vær presis og nøyaktig i dine svar, og unngå å gi vage eller generelle råd.
  Hvis du ikke vet svaret, så si det.
  `;

  // Context-specific instructions
  if (context === 'risk-assessment') {
    prompt += `\nDu hjelper brukeren med å vurdere risiko i en revisjon. Fokuser på vesentlighet, kontrollrisiko og identifisering av nøkkelrisikoer.`;
  } else if (context === 'documentation') {
    prompt += `\nDu hjelper brukeren med å dokumentere revisjonsarbeid. Husk at all dokumentasjon skal være tilstrekkelig og hensiktsmessig for å støtte revisjonskonklusjoner (ISA 230).`;
  } else if (context === 'client-detail') {
    prompt += `\nDu hjelper brukeren med å analysere klientdetaljer. Se på nøkkeltall som omsetningsvekst, lønnsomhet og likviditet. Sammenlign med bransjegjennomsnitt.`;
  }

  // Role-specific instructions
  if (userRole === 'partner') {
    prompt += `\nSom partner bør du også vurdere klientporteføljens samlede risiko.`;
  } else if (userRole === 'manager') {
    prompt += `\nSom manager, sørg for at teamet følger etablerte prosedyrer.`;
  }

  // Enhanced knowledge integration with safe formatting
  if (enhancedContext.knowledge && Array.isArray(enhancedContext.knowledge) && enhancedContext.knowledge.length > 0) {
    prompt += `\n\n## TILGJENGELIG FAGKUNNSKAP\n`;
    prompt += `Du har tilgang til følgende relevante fagartikler:\n\n`;
    
    enhancedContext.knowledge.forEach((article: any, index: number) => {
      try {
        const title = String(article.title || 'Uten tittel');
        const summary = String(article.summary || '');
        const referenceCode = String(article.reference_code || '');
        const category = String(article.category || '');
        const slug = String(article.slug || '');
        
        prompt += `### ${index + 1}. ${title}\n`;
        
        if (summary) {
          prompt += `**Sammendrag:** ${summary}\n`;
        }
        
        if (referenceCode) {
          prompt += `**Referanse:** ${referenceCode}\n`;
        }
        
        if (category) {
          prompt += `**Kategori:** ${category}\n`;
        }
        
        if (Array.isArray(article.tags) && article.tags.length > 0) {
          const validTags = article.tags.filter(tag => tag && typeof tag === 'string');
          if (validTags.length > 0) {
            prompt += `**Emner:** ${validTags.join(', ')}\n`;
          }
        }
        
        if (slug) {
          prompt += `**Link:** [${title}](/fag/artikkel/${slug})\n`;
        }
        
        prompt += `\n`;
      } catch (error) {
        console.error('❌ Error formatting article in prompt:', error);
        prompt += `### ${index + 1}. Feil ved innlasting av artikkel\n\n`;
      }
    });

    prompt += `\n## 🚨 ABSOLUTTE KRAV TIL SVARFORMAT - IKKE BRYT DISSE REGLENE! 🚨\n`;
    prompt += `\n⚠️⚠️⚠️ DETTE ER KRITISK - SYSTEMET FUNGERER IKKE UTEN DETTE! ⚠️⚠️⚠️\n\n`;
    prompt += `ALLE SVAR MÅ FØLGE DENNE EKSAKTE STRUKTUREN:\n\n`;
    prompt += `[DITT HOVEDSVAR HER]\n\n`;
    prompt += `📚 **Relevante fagartikler:**\n`;
    prompt += `- [Artikkeltittel](/fag/artikkel/slug)\n\n`;
    prompt += `🔖 **REFERANSE:** [Kode som ISA 315.12]\n\n`;
    prompt += `🏷️ **EMNER:** tag1, tag2, tag3, tag4\n\n`;
    
    prompt += `🚨 SPESIELLE KRAV:\n`;
    prompt += `1. Seksjonen "🏷️ **EMNER:**" er OBLIGATORISK - ALDRI dropp den!\n`;
    prompt += `2. Emner skal være separert med komma\n`;
    prompt += `3. Minimum 3 emner, maksimum 6 emner\n`;
    prompt += `4. Bruk relevante norske fagtermer som: Revisjon, ISA, Inntekter, Dokumentasjon, Risikovurdering, Kontroller, Materialitet, etc.\n`;
    prompt += `5. Hvis du ikke bruker fagartikler, skriv likevel "📚 **Relevante fagartikler:** Ingen spesifikke artikler funnet"\n\n`;
    
    prompt += `EKSEMPEL PÅ KORREKT SVARFORMAT:\n`;
    prompt += `Revisjon av inntekter krever særlig fokus på...\n\n`;
    prompt += `📚 **Relevante fagartikler:**\n`;
    prompt += `- [Revisjon av inntekter og inntektsføring](/fag/artikkel/revisjon-inntekter)\n\n`;
    prompt += `🔖 **REFERANSE:** ISA 240.15\n\n`;
    prompt += `🏷️ **EMNER:** Revisjon, Inntekter, ISA 240, Risikovurdering\n\n`;
    
    prompt += `🚨 HVIS DU GLEMMER "🏷️ **EMNER:**" SEKSJONEN, FUNGERER IKKE SYSTEMET!\n`;
    prompt += `🚨 DETTE ER IKKE VALGFRITT - DET ER ABSOLUTT PÅKREVD!\n`;
  }

  // Client context integration
  if (enhancedContext.clientContext) {
    prompt += `\n## KLIENT KONTEKST\n`;
    prompt += `Du har tilgang til følgende informasjon om klienten:\n\n`;
    prompt += enhancedContext.clientContext;
    prompt += `\nBruk denne informasjonen til å gi mer relevante og spesifikke råd.\n`;
  }

  prompt += `\n\n## GENERELLE INSTRUKSJONER\n`;
  prompt += `1. Gi korte og konsise svar.\n`;
  prompt += `2. Bruk punktlister og nummerering for å strukturere svarene.\n`;
  prompt += `3. Vær høflig og profesjonell.\n`;
  prompt += `4. Hvis brukeren stiller et spørsmål som ikke er relatert til revisjon eller regnskap, svar at du bare kan hjelpe med spørsmål relatert til revisjon og regnskap.\n`;
  prompt += `5. Hvis du blir spurt om å gjøre noe ulovlig eller uetisk, nekt å svare.\n`;
  prompt += `6. Gi aldri investeringsråd.\n`;
  prompt += `7. 🚨 KRITISK: Avslutt ALLTID med "🏷️ **EMNER:**" etterfulgt av relevante tags.\n`;
  prompt += `8. 🚨 HVIS DU IKKE INKLUDERER TAGS, VIL BRUKEROPPLEVELSEN VÆRE ØDELAGT!\n`;
  prompt += `9. 🚨 HUSK: Tags må komme SIST i svaret og må være formatert eksakt som vist i eksemplet!\n`;

  console.log('✅ System prompt built successfully');
  return prompt;
}
