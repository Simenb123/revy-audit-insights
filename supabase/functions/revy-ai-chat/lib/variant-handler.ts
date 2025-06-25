
import { log } from '../_shared/log.ts';

export async function getVariantSystemPrompt(
  variant: any,
  context: string,
  clientData: any | null
): Promise<string> {
  if (!variant || !variant.system_prompt_template) {
    return '';
  }

  log('🎭 Building variant system prompt for:', variant.name);

  let promptTemplate = variant.system_prompt_template;

  // Replace placeholders in the template
  if (clientData) {
    promptTemplate = promptTemplate.replace(/\{client_name\}/g, clientData.company_name || clientData.name || 'klienten');
    promptTemplate = promptTemplate.replace(/\{client_org_number\}/g, clientData.org_number || 'ikke oppgitt');
    promptTemplate = promptTemplate.replace(/\{client_industry\}/g, clientData.industry || 'ikke oppgitt');
  }

  promptTemplate = promptTemplate.replace(/\{context\}/g, context);

  log('✅ Variant system prompt built for:', variant.name);
  return promptTemplate;
}

export function getVariantContextualTips(
  variant: any,
  context: string,
  clientData: any | null
): string {
  if (!variant) {
    return '';
  }

  const tips = {
    'methodology-expert': `Som metodikk-ekspert kan jeg hjelpe deg med ISA-standarder, revisjonsmetodikk og systematiske tilnærminger.`,
    'professional-knowledge': `Som fagekspert kan jeg gi deg dybdegående kunnskap om revisjon, regnskapsføring og lovverk.`,
    'client-guide': `Som klient-veileder kan jeg hjelpe deg med praktisk gjennomføring av ${clientData?.company_name || 'denne klientens'} revisjon.`,
    'technical-support': `Som teknisk støtte kan jeg hjelpe deg med systemfunksjoner og arbeidsflyt.`
  };

  return tips[variant.name as keyof typeof tips] || '';
}
