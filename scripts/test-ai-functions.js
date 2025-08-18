/**
 * Simple test script to verify AI functions are working
 * Run with: node scripts/test-ai-functions.js
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fxelhfwaoizqyecikscu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAITransactionAnalysis() {
  console.log('🧪 Testing AI Transaction Analysis V2...');
  
  try {
    const { data, error } = await supabase.functions.invoke('ai-transaction-analysis-v2', {
      body: {
        clientId: '8e5a5e79-8510-4e80-98a0-65e6548585ef',
        dataVersionId: 'ba5e62eb-b4f5-4c36-9a64-29ff169873d5',
        sessionType: 'test_analysis',
        analysisConfig: {
          analysisType: 'comprehensive',
          includeRiskAnalysis: true,
          testMode: true
        }
      }
    });

    if (error) {
      console.error('❌ AI Transaction Analysis failed:', error);
      return false;
    }

    console.log('✅ AI Transaction Analysis V2 test passed');
    console.log('Response:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ AI Transaction Analysis test failed:', error.message);
    return false;
  }
}

async function testKnowledgeSearch() {
  console.log('🧪 Testing Knowledge Search...');
  
  try {
    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: {
        query: 'ISA 315 test',
        limit: 5
      }
    });

    if (error) {
      console.error('❌ Knowledge Search failed:', error);
      return false;
    }

    console.log('✅ Knowledge Search test passed');
    console.log(`Found ${data?.articles?.length || 0} articles`);
    return true;
  } catch (error) {
    console.error('❌ Knowledge Search test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting AI Functions Smoke Test...\n');
  
  const results = await Promise.allSettled([
    testAITransactionAnalysis(),
    testKnowledgeSearch()
  ]);

  const passed = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const total = results.length;

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All AI functions are working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some AI functions are not working properly');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});