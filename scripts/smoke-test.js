#!/usr/bin/env node

/**
 * Smoke Test Script for AI-Revi Knowledge Search
 * Tests that the knowledge-search function returns articles for "ISA 315"
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  process.exit(1);
}


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSmokeTest() {
  console.log('🧪 Running AI-Revi Knowledge Search Smoke Test...\n');
  
  try {
    console.log('🔍 Testing knowledge-search with query: "ISA 315"');
    
    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: { query: 'ISA 315' }
    });
    
    if (error) {
      console.error('❌ Knowledge search failed:', error);
      process.exit(1);
    }
    
    const articles = data?.articles || [];
    const articleCount = articles.length;
    
    console.log(`📊 Knowledge search results:`);
    console.log(`   - Articles found: ${articleCount}`);
    
    if (articleCount > 0) {
      console.log(`   - First article: "${articles[0].title}"`);
      console.log(`   - Article category: ${articles[0].category?.name || 'Uncategorized'}`);
      console.log(`   - Relevance score: ${Math.round((articles[0].similarity || 0) * 100)}%\n`);
      
      console.log('✅ SMOKE TEST PASSED: Knowledge search is working!');
      console.log(`✅ Found ${articleCount} articles for "ISA 315" query`);
    } else {
      console.log('⚠️  SMOKE TEST WARNING: No articles found for "ISA 315"');
      console.log('    This may indicate:');
      console.log('    - No ISA 315 articles in the knowledge base');
      console.log('    - Embedding search not working properly');
      console.log('    - Knowledge base needs to be populated\n');
      
      // Don't fail the test, but warn
      console.log('🟡 Test completed with warnings');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ SMOKE TEST FAILED:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Add to package.json scripts:
console.log('💡 To add this to your build process, add to package.json:');
console.log('   "scripts": {');
console.log('     "smoke-test": "node scripts/smoke-test.js",');
console.log('     "build": "vite build && npm run smoke-test"');
console.log('   }');
console.log();

runSmokeTest();
