import { logger } from '@/utils/logger';

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

interface ArticleData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_id: string;
  content_type_id: string;
  author_id: string;
  status: 'published';
  reference_code?: string;
  published_at: string;
}

export const seedKnowledgeBase = async () => {
  if (!isSupabaseConfigured || !supabase) {
    logger.error("Supabase is not configured. Seeder cannot proceed.");
    return;
  }
  logger.log('🌱 Starting knowledge base seeding...');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Get or create default category
    let categoryId = '';
    const { data: existingCategory } = await supabase
      .from('knowledge_categories')
      .select('id')
      .eq('name', 'Revisjonstandarder')
      .single();
      
    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const { data: newCategory, error: categoryError } = await supabase
        .from('knowledge_categories')
        .insert({
          name: 'Revisjonstandarder',
          description: 'ISA-standarder og revisjonsmetodikk',
          display_order: 1
        })
        .select('id')
        .single();
        
      if (categoryError || !newCategory) {
        throw categoryError || new Error('Failed to create category');
      }
      categoryId = newCategory.id;
    }

    // Get or create default content type
    let contentTypeId = '';
    const { data: existingContentType } = await supabase
      .from('content_types')
      .select('id')
      .eq('name', 'fagartikkel')
      .single();
      
    if (existingContentType) {
      contentTypeId = existingContentType.id;
    } else {
      const { data: newContentType, error: contentTypeError } = await supabase
        .from('content_types')
        .insert({
          name: 'fagartikkel',
          display_name: 'Fagartikkel',
          description: 'Standard fagartikkel',
          icon: 'file-text',
          color: '#3B82F6',
          sort_order: 1
        })
        .select('id')
        .single();
        
      if (contentTypeError || !newContentType) {
        throw contentTypeError || new Error('Failed to create content type');
      }
      contentTypeId = newContentType.id;
    }

    // Prepare articles data without tags field
    const articles: ArticleData[] = [
      {
        title: 'ISA 315 - Identifisering og vurdering av risiko',
        slug: 'isa-315-risikovurdering',
        summary: 'ISA 315 setter krav til revisors forståelse av enheten og dens omgivelser.',
        content: `ISA 315 "Identifisering og vurdering av risiko for vesentlig feilinformasjon gjennom forståelse av enheten og dens omgivelser" er en grunnleggende standard.

## Hovedkrav i ISA 315

### 1. Forståelse av enheten og dens omgivelser
Revisor skal skaffe seg forståelse av:
- Enhetens bransje, regulatoriske faktorer og andre eksterne faktorer
- Enhetens art, inkludert valg og anvendelse av regnskapsprinsipper
- Enhetens mål og strategier og tilhørende forretningsrisiko
- Måling og gjennomgang av enhetens finansielle resultater
- Enhetens internkontroll

### 2. Risikoidentifisering og -vurdering
Revisor skal:
- Identifisere risiko for vesentlig feilinformasjon på regnskaps- og påstandsnivå
- Vurdere den identifiserte risikoen og fastslå om den relaterer seg til spesifikke påstander
- Vurdere sannsynligheten for at risikoen vil resultere i vesentlig feilinformasjon

Standarden er grunnleggende for all revisjonsplanlegging og må forstås grundig av alle revisorer.`,
        category_id: categoryId,
        content_type_id: contentTypeId,
        author_id: user.id,
        status: 'published' as const,
        reference_code: 'ISA 315',
        published_at: new Date().toISOString()
      },
      {
        title: 'ISA 230 - Revisjonsdokumentasjon',
        slug: 'isa-230-dokumentasjon',
        summary: 'ISA 230 setter krav til revisjonsdokumentasjon som grunnlag for revisjonsuttalelsen.',
        content: `ISA 230 "Revisjonsdokumentasjon" etablerer standarder og gir veiledning om dokumentasjon i forbindelse med revisjon av regnskap.

## Formålet med revisjonsdokumentasjon

Revisjonsdokumentasjon skal:
- Gi tilstrekkelig og hensiktsmessig revisjonsbevis som grunnlag for revisjonsuttalelsen
- Vise at revisjonen er planlagt og utført i samsvar med ISA og relevante lovkrav
- Hjelpe revisjonsteamet med å planlegge og utføre revisjonen
- Gjøre det mulig for erfarne revisorer å forstå arten, tidspunktet og omfanget av revisjonshandlinger

God revisjonsdokumentasjon er grunnleggende for kvalitet i revisjonsarbeidet.`,
        category_id: categoryId,
        content_type_id: contentTypeId,
        author_id: user.id,
        status: 'published' as const,
        reference_code: 'ISA 230',
        published_at: new Date().toISOString()
      },
      {
        title: 'Materialitetsvurdering i revisjon',
        slug: 'materialitet-revisjon',
        summary: 'Materialitet er et grunnleggende konsept i revisjon som påvirker planlegging, gjennomføring og konklusjon.',
        content: `Materialitet er et sentralt konsept i revisjon som påvirker alle aspekter av revisjonsarbeidet, fra planlegging til konklusjon.

## Hva er materialitet?

Materialitet refererer til størrelsen på utelatelser eller feil i regnskapet som, individuelt eller samlet, med rimelig grad av sannsynlighet kunne påvirke økonomiske beslutninger som brukerne av regnskapet tar basert på regnskapet.

## Typer materialitet

### 1. Materialitet for regnskapet som helhet
- Den høyeste verdien av feil som kan aksepteres for regnskapet totalt
- Fastsettes tidlig i planleggingsfasen
- Baseres normalt på en prosentsats av en relevant benchmark

God materialitetsvurdering er kritisk for en effektiv og effektiv revisjon.`,
        category_id: categoryId,
        content_type_id: contentTypeId,
        author_id: user.id,
        status: 'published' as const,
        published_at: new Date().toISOString()
      }
    ];

    // Insert articles
    for (const article of articles) {
      // Check if article already exists
      const { data: existing } = await supabase
        .from('knowledge_articles')
        .select('id')
        .eq('slug', article.slug)
        .single();
        
      if (!existing) {
        const { error } = await supabase
          .from('knowledge_articles')
          .insert(article);
          
        if (error) {
          logger.error(`❌ Failed to create article "${article.title}":`, error);
        } else {
          logger.log(`✅ Created article: "${article.title}"`);
        }
      } else {
        logger.log(`⏭️ Article "${article.title}" already exists`);
      }
    }
    
    logger.log('🌱 Knowledge base seeding completed!');
    
  } catch (error: any) {
    logger.error('❌ Knowledge base seeding failed:', error);
    throw error;
  }
};
