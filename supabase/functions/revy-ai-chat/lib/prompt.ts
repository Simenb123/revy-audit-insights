
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

  let prompt = `Du er en hjelpsom assistent som spesialiserer deg på revisjon og regnskap.
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
        prompt += `### ${index + 1}. ${article.title || 'Uten tittel'}\n`;
        
        if (article.summary) {
          prompt += `**Sammendrag:** ${article.summary}\n`;
        }
        
        if (article.reference_code) {
          prompt += `**Referanse:** ${article.reference_code}\n`;
        }
        
        if (article.category) {
          prompt += `**Kategori:** ${article.category}\n`;
        }
        
        if (Array.isArray(article.tags) && article.tags.length > 0) {
          const validTags = article.tags.filter(tag => tag && typeof tag === 'string');
          if (validTags.length > 0) {
            prompt += `**Emner:** ${validTags.join(', ')}\n`;
          }
        }
        
        if (article.slug) {
          prompt += `**Link:** [${article.title || 'Artikkel'}](/fag/artikkel/${article.slug})\n`;
        }
        
        prompt += `\n`;
      } catch (error) {
        console.error('❌ Error formatting article in prompt:', error);
        prompt += `### ${index + 1}. Feil ved innlasting av artikkel\n\n`;
      }
    });

    prompt += `\n## INSTRUKSJONER FOR BRUK AV FAGKUNNSKAP\n`;
    prompt += `1. Referer alltid til relevante fagartikler når de finnes\n`;
    prompt += `2. Inkluder lenker til artiklene i dine svar\n`;
    prompt += `3. Vis referansekoder (f.eks. ISA 315) når tilgjengelig\n`;
    prompt += `4. Presenter emner/tags på en strukturert måte\n`;
    prompt += `5. Bruk denne formateringen for artikelreferanser:\n\n`;
    prompt += `📚 **Relevante fagartikler:**\n`;
    prompt += `- [Artikkeltittel](/fag/artikkel/slug)\n\n`;
    prompt += `🔖 **REFERANSE:** Referansekode (hvis tilgjengelig)\n\n`;
    prompt += `🏷️ **EMNER:** tag1, tag2, tag3 (hvis tilgjengelig)\n\n`;
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
  prompt += `7. Hvis fagartikler er tilgjengelige, vis dem alltid i en organisert måte med riktig formatering.\n`;

  console.log('✅ System prompt built successfully');
  return prompt;
}
