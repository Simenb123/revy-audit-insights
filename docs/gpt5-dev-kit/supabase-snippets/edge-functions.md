# Supabase Edge Functions Snippets

## Standard Edge Function Template

### Basic Function Structure
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { param1, param2 } = await req.json();

    // Your function logic here
    const result = await performOperation(param1, param2);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

## AI Integration Functions

### OpenAI Chat Function
```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, history } = await req.json();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build system prompt based on context
    let systemPrompt = `Du er Revy, en AI-assistent for norske revisorer. 
    Du hjelper med revisjonsoppgaver, regnskapsanalyse og veiledning.
    Svar alltid på norsk og vær presis og profesjonell.`;

    if (context?.client_id) {
      systemPrompt += `\n\nKlient-ID: ${context.client_id}`;
    }

    if (context?.document_context) {
      systemPrompt += `\n\nDokument kontekst: ${context.document_context}`;
    }

    // Prepare messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const aiResponse = data.choices[0].message.content;

    // Log AI usage (optional)
    // await logAIUsage(user.id, 'chat', data.usage);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### Document Analysis Function
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, analysisType } = await req.json();
    
    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get document content
    const { data: document, error: docError } = await supabase
      .from('client_documents_files')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Perform AI analysis based on type
    let analysisResult;
    switch (analysisType) {
      case 'categorization':
        analysisResult = await categorizeDocument(document.extracted_text);
        break;
      case 'summary':
        analysisResult = await summarizeDocument(document.extracted_text);
        break;
      case 'key_data':
        analysisResult = await extractKeyData(document.extracted_text);
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    // Update document with analysis results
    const { error: updateError } = await supabase
      .from('client_documents_files')
      .update({
        ai_analysis_summary: analysisResult.summary,
        ai_suggested_category: analysisResult.category,
        ai_extracted_data: analysisResult.extracted_data,
        ai_analysis_completed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysisResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
async function categorizeDocument(text: string) {
  // AI categorization logic
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Du er en AI som kategoriserer regnskapsdokumenter. Foreslå en kategori basert på innholdet.'
      }, {
        role: 'user',
        content: `Kategoriser dette dokumentet: ${text.substring(0, 2000)}`
      }],
      max_tokens: 200,
    }),
  });

  const data = await response.json();
  return {
    category: data.choices[0].message.content,
    confidence: 0.85,
  };
}
```

## File Processing Functions

### PDF Text Extraction
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, documentId } = await req.json();
    
    // Download file
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.arrayBuffer();
    
    // Extract text (this would use a PDF parsing library)
    const extractedText = await extractPDFText(fileBuffer);
    
    // Update document in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase
      .from('client_documents_files')
      .update({
        extracted_text: extractedText,
        text_extraction_status: 'completed',
        text_extraction_completed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (error) throw error;

    return new Response(JSON.stringify({ 
      success: true, 
      extractedText: extractedText.substring(0, 500) // Preview
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Database Helper Functions

### RLS Policy Helper
```typescript
// Helper to check user permissions
async function checkUserPermission(supabase: any, userId: string, clientId: string) {
  const { data, error } = await supabase
    .from('client_team_members')
    .select('role')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    throw new Error('Access denied');
  }

  return data.role;
}

// Helper to log AI usage
async function logAIUsage(supabase: any, userId: string, requestType: string, usage: any) {
  await supabase
    .from('ai_usage_logs')
    .insert({
      user_id: userId,
      model: usage.model || 'gpt-4o-mini',
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      estimated_cost_usd: calculateCost(usage),
      request_type: requestType,
    });
}
```

## Testing Helper
```typescript
// Development/testing endpoint
if (Deno.env.get('ENVIRONMENT') === 'development') {
  if (req.url.includes('/health')) {
    return new Response(JSON.stringify({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: Deno.env.get('ENVIRONMENT') 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
```