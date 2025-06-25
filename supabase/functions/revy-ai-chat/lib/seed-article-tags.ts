
import { supabase } from './supabase.ts';
import { log } from '../_shared/log.ts';

export async function seedArticleTags() {
  log('🏷️ Adding tags to existing articles using linking table...');
  
  const articles = [
    {
      title: 'Grunnleggende revisjonsteknikker for nye revisorer',
      tags: ['Revisjon', 'Grunnleggende', 'Teknikker', 'Nye revisorer']
    },
    {
      title: 'ISA 315 - Identifisering og vurdering av risiko for vesentlig feilinformasjon',
      tags: ['ISA 315', 'Risikovurdering', 'Vesentlig feilinformasjon', 'Standarder']
    },
    {
      title: 'Revisjon av inntekter og inntektsføring',
      tags: ['Inntekter', 'Inntektsføring', 'Revisjon', 'ISA 240']
    },
    {
      title: 'Dokumentasjonskrav i revisjon per ISA 230',
      tags: ['Dokumentasjon', 'ISA 230', 'Krav', 'Arbeidspapirer']
    },
    {
      title: 'Risikovurdering og planlegging av revisjonsarbeid',
      tags: ['Risikovurdering', 'Planlegging', 'Revisjonsarbeid', 'ISA 300']
    },
    {
      title: 'Kontroll av varelager og varetelling',
      tags: ['Varelager', 'Varetelling', 'Kontroll', 'Observasjon']
    },
    {
      title: 'Revisjon av lønn og personalkostnader',
      tags: ['Lønn', 'Personalkostnader', 'Revisjon', 'Kontroller']
    },
    {
      title: 'Kundefordringer og kredittvurdering',
      tags: ['Kundefordringer', 'Kredittvurdering', 'Tap på fordringer', 'Aldersanalyse']
    },
    {
      title: 'MVA og avgiftsbehandling i revisjonssammenheng',
      tags: ['MVA', 'Avgifter', 'Skatt', 'Kontroll']
    },
    {
      title: 'Årsavslutning og regnskapsavleggelse',
      tags: ['Årsavslutning', 'Regnskapsavleggelse', 'Periodisering', 'Cut-off']
    }
  ];

  for (const article of articles) {
    try {
      const { data: articleRecord, error: findError } = await supabase
        .from('knowledge_articles')
        .select('id')
        .ilike('title', `%${article.title.substring(0, 20)}%`)
        .single();

      if (findError || !articleRecord) {
        console.error(`❌ Error finding article "${article.title}":`, findError);
        continue;
      }

      for (const tagName of article.tags) {
        const tagKey = tagName.trim().toLowerCase().replace(/\s+/g, '_');

        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagKey)
          .maybeSingle();

        let tagId = existingTag?.id;

        if (!tagId) {
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({
              name: tagKey,
              display_name: tagName.trim(),
              color: '#3B82F6',
              category: 'article',
              sort_order: 999,
              is_active: true,
            })
            .select('id')
            .single();

          if (tagError) {
            console.error(`❌ Error creating tag "${tagName}":`, tagError);
            continue;
          }

          tagId = newTag.id;
        }

        const { error: linkError } = await supabase
          .from('knowledge_article_tags')
          .insert({ article_id: articleRecord.id, tag_id: tagId });

        if (linkError && !linkError.message.includes('duplicate')) {
          console.error(
            `❌ Error linking tag "${tagName}" to article "${article.title}":`,
            linkError,
          );
        }
      }

      log(`✅ Updated tags for: ${article.title}`);
    } catch (error) {
      console.error(`❌ Failed to update article "${article.title}":`, error);
    }
  }
  
  log('🏷️ Article tags seeding completed');
}
