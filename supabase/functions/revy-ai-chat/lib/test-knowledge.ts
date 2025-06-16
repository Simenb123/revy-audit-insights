
import { supabase } from './supabase.ts';

// Test function to verify knowledge search functionality
export async function testKnowledgeAccess() {
  console.log('🧪 Testing knowledge database access...');
  
  try {
    // Test basic connection
    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select('id, title, status')
      .limit(5);
    
    if (error) {
      console.error('❌ Knowledge access error:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Found ${articles?.length || 0} articles in database`);
    
    // Test published articles specifically
    const { data: publishedArticles, error: publishedError } = await supabase
      .from('knowledge_articles')
      .select('id, title, status')
      .eq('status', 'published')
      .limit(5);
    
    if (publishedError) {
      console.error('❌ Published articles error:', publishedError);
      return { success: false, error: publishedError.message };
    }
    
    console.log(`✅ Found ${publishedArticles?.length || 0} published articles`);
    
    return { 
      success: true, 
      totalArticles: articles?.length || 0,
      publishedArticles: publishedArticles?.length || 0
    };
    
  } catch (error) {
    console.error('💥 Knowledge test failed:', error);
    return { success: false, error: error.message };
  }
}
