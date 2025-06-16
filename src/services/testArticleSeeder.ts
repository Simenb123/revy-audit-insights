
import { supabase } from '@/integrations/supabase/client';

export const createTestArticles = async () => {
  console.log('🌱 Creating test articles for knowledge base...');
  
  // First get or create a test category
  let categoryId = '';
  
  const { data: existingCategory } = await supabase
    .from('knowledge_categories')
    .select('id')
    .eq('name', 'Revisjon')
    .single();
    
  if (existingCategory) {
    categoryId = existingCategory.id;
  } else {
    const { data: newCategory, error: categoryError } = await supabase
      .from('knowledge_categories')
      .insert({
        name: 'Revisjon',
        description: 'Generelle revisjonsartikler',
        display_order: 1
      })
      .select('id')
      .single();
      
    if (categoryError || !newCategory) {
      console.error('❌ Failed to create category:', categoryError);
      return;
    }
    categoryId = newCategory.id;
  }
  
  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No authenticated user found');
    return;
  }
  
  const testArticles = [
    {
      title: 'Revisjon av inntekter - ISA 315',
      slug: 'revisjon-av-inntekter-isa-315',
      summary: 'Praktisk veiledning for revisjon av inntekter i henhold til ISA 315',
      content: `
        <h2>Innledning</h2>
        <p>Revisjon av inntekter er et sentralt område i alle revisjoner. ISA 315 krever at revisor identifiserer og vurderer risiko for vesentlig feilinformasjon på regnskapslinjenivå.</p>
        
        <h2>Viktige prinsipper</h2>
        <ul>
          <li>Inntekter skal regnskapsføres når de er opptjent</li>
          <li>Inntektsføring skal skje i riktig periode</li>
          <li>Alle inntekter skal være fullstendige og nøyaktige</li>
        </ul>
        
        <h2>Revisjonshandlinger</h2>
        <p>Typiske revisjonshandlinger inkluderer:</p>
        <ul>
          <li>Analytiske handlinger på inntektsutvikling</li>
          <li>Stikkprøver av salgstransaksjoner</li>
          <li>Avskjæringsprøver</li>
          <li>Bekreftelser fra kunder</li>
        </ul>
        
        <h2>Risikoområder</h2>
        <p>Særlig oppmerksomhet bør rettes mot:</p>
        <ul>
          <li>Inntektsføring nær regnskapsårets slutt</li>
          <li>Komplekse inntektskontrakter</li>
          <li>Kreditnotaer etter regnskapsårets slutt</li>
        </ul>
      `,
      category_id: categoryId,
      status: 'published' as const,
      author_id: user.id,
      tags: ['revisjon', 'inntekter', 'isa-315'],
      reference_code: 'ISA 315',
      published_at: new Date().toISOString()
    },
    {
      title: 'Grunnleggende om ISA-standarder',
      slug: 'grunnleggende-om-isa-standarder',
      summary: 'En introduksjon til International Standards on Auditing (ISA)',
      content: `
        <h2>Hva er ISA-standarder?</h2>
        <p>International Standards on Auditing (ISA) er internasjonale revisjonsstandarder utviklet av International Auditing and Assurance Standards Board (IAASB).</p>
        
        <h2>Sentrale ISA-standarder</h2>
        <ul>
          <li><strong>ISA 200:</strong> Overordnede målsettinger for den uavhengige revisor</li>
          <li><strong>ISA 315:</strong> Identifisering og vurdering av risiko for vesentlig feilinformasjon</li>
          <li><strong>ISA 330:</strong> Revisors respons på vurdert risiko</li>
          <li><strong>ISA 500:</strong> Revisjonsbevis</li>
          <li><strong>ISA 700:</strong> Utforming av konklusjoner og rapportering</li>
        </ul>
        
        <h2>Implementering i Norge</h2>
        <p>ISA-standardene er implementert i Norge gjennom Revisorloven og forskrift om revisjon.</p>
        
        <h2>Viktige prinsipper</h2>
        <ul>
          <li>Uavhengighet og objektivitet</li>
          <li>Faglig skjønn og profesjonell skepsis</li>
          <li>Tilstrekkelig og hensiktsmessig revisjonsbevis</li>
          <li>Dokumentasjon av revisjonsarbeidet</li>
        </ul>
      `,
      category_id: categoryId,
      status: 'published' as const,
      author_id: user.id,
      tags: ['isa', 'standarder', 'revisjon', 'prinsipper'],
      reference_code: 'ISA Oversikt',
      published_at: new Date().toISOString()
    },
    {
      title: 'Praktisk guide til revisjonshandlinger',
      slug: 'praktisk-guide-til-revisjonshandlinger',
      summary: 'Oversikt over de mest brukte revisjonshandlingene i praksis',
      content: `
        <h2>Typer revisjonshandlinger</h2>
        <p>Revisjonshandlinger kan deles inn i følgende hovedkategorier:</p>
        
        <h3>1. Analytiske handlinger</h3>
        <ul>
          <li>Sammenligning med fjorårets tall</li>
          <li>Forholdsanalyser og nøkkeltall</li>
          <li>Trendanalyser</li>
          <li>Sammenligning med bransjen</li>
        </ul>
        
        <h3>2. Detaljprøving</h3>
        <ul>
          <li>Stikkprøver av transaksjoner</li>
          <li>Fullstendig gjennomgang av spesifikke områder</li>
          <li>Dokumentasjonsgjennomgang</li>
        </ul>
        
        <h3>3. Bekreftelser</h3>
        <ul>
          <li>Kundebekreftelser</li>
          <li>Leverandørbekreftelser</li>
          <li>Bankbekreftelser</li>
          <li>Advokatsbekreftelser</li>
        </ul>
        
        <h3>4. Observasjon og inspeksjon</h3>
        <ul>
          <li>Varetellingsobservasjon</li>
          <li>Inspeksjon av dokumenter</li>
          <li>Observasjon av prosesser</li>
        </ul>
        
        <h2>Valg av revisjonshandlinger</h2>
        <p>Valget av revisjonshandlinger avhenger av:</p>
        <ul>
          <li>Risikovurdering</li>
          <li>Vesentlighet</li>
          <li>Tilgjengelig revisjonsbevis</li>
          <li>Kostnadseffektivitet</li>
        </ul>
      `,
      category_id: categoryId,
      status: 'published' as const,
      author_id: user.id,
      tags: ['revisjonshandlinger', 'metoder', 'praktisk', 'veiledning'],
      reference_code: 'PRAKSIS-001',
      published_at: new Date().toISOString()
    }
  ];
  
  for (const article of testArticles) {
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
        console.error(`❌ Failed to create article "${article.title}":`, error);
      } else {
        console.log(`✅ Created article: "${article.title}"`);
      }
    } else {
      console.log(`⏭️ Article "${article.title}" already exists`);
    }
  }
  
  console.log('🌱 Test articles creation completed!');
};
