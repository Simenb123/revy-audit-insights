
import { supabase } from './supabase.ts';

export async function seedArticleTags() {
  console.log('🏷️ Adding tags to existing articles...');
  
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
      const { error } = await supabase
        .from('knowledge_articles')
        .update({ tags: article.tags })
        .ilike('title', `%${article.title.substring(0, 20)}%`);
      
      if (error) {
        console.error(`❌ Error updating tags for "${article.title}":`, error);
      } else {
        console.log(`✅ Updated tags for: ${article.title}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update article "${article.title}":`, error);
    }
  }
  
  console.log('🏷️ Article tags seeding completed');
}
