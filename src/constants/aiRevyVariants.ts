export const AI_REVY_VARIANT_NAMES = ['methodology', 'professional', 'guide', 'support'] as const;
export type AIRevyVariantName = typeof AI_REVY_VARIANT_NAMES[number];

export interface AIRevyVariantInfo {
  name: AIRevyVariantName;
  displayName: string;
  description: string;
}

export const aiRevyVariants: Record<AIRevyVariantName, AIRevyVariantInfo> = {
  methodology: {
    name: 'methodology',
    displayName: 'AI-Revy Metodikk',
    description: 'Spesialisert på revisjonsmetodikk og ISA-standarder'
  },
  professional: {
    name: 'professional',
    displayName: 'AI-Revy Faglig',
    description: 'Faglig støtte innen regnskapslovgivning og bransjeforhold'
  },
  guide: {
    name: 'guide',
    displayName: 'AI-Revy Veileder',
    description: 'Veiledende hjelp for nye medarbeidere og opplæring'
  },
  support: {
    name: 'support',
    displayName: 'AI-Revy Support',
    description: 'Teknisk support og systemhjelp'
  }
};
