export async function callOpenAI(
  endpoint: string,
  body: Record<string, unknown>
) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Transform max_tokens to max_completion_tokens for newer models
  if (body.max_tokens && (body.model as string)?.startsWith('gpt-5')) {
    body.max_completion_tokens = body.max_tokens;
    delete body.max_tokens;
  }

  const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  return response.json();
}
