export const GPT5_MODELS = ["gpt-5-mini", "gpt-5", "gpt-5-nano"] as const;

export function extractTextFromResponse(resp: any): string {
  // Chat Completions
  const fromChat = resp?.choices?.[0]?.message?.content;
  if (fromChat && typeof fromChat === "string" && fromChat.trim()) return fromChat.trim();

  // Responses API (fallback – hvis noen fortsatt bruker det)
  const text1 = resp?.output_text;
  if (text1 && typeof text1 === "string" && text1.trim()) return text1.trim();

  if (Array.isArray(resp?.output)) {
    const parts = resp.output.map((p: any) => p?.content?.[0]?.text?.value || "").filter(Boolean);
    const joined = parts.join("\n").trim();
    if (joined) return joined;
  }
  return "";
}

export async function chatWithFallback({
  apiKey,
  messages,
  maxTokens = 1500,
  temperature = 0.7,
}: {
  apiKey: string;
  messages: Array<{ role: "system"|"user"|"assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
}) {
  for (const model of GPT5_MODELS) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,     // riktig felt for Chat Completions
          temperature,
        }),
      });

      if (!r.ok) continue;
      const j = await r.json();
      const text = extractTextFromResponse(j);
      if (text) return { model, text };
    } catch {
      // prøv neste modell
    }
  }
  throw new Error("Alle GPT-5-modeller feilet eller ga tomt svar");
}

export async function callOpenAI(
  endpoint: string,
  body: Record<string, unknown>
) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
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
