const DEFAULT_ORIGINS = ['http://localhost:5173', 'https://ai-revy.example.com'];

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? DEFAULT_ORIGINS.join(','))
  .split(',')
  .map(o => o.trim());

export function getCors(origin: string | null) {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return null;
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  } as Record<string, string>;
}

export function isOptions(req: Request): boolean {
  return req.method === 'OPTIONS';
}

export function handleCors(req: Request): Response {
  const headers = getCors(req.headers.get('Origin'));
  if (!headers) {
    return new Response('Forbidden', { status: 403 });
  }
  return new Response(null, { headers });
}
