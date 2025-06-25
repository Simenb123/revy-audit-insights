import { log } from './log.ts';

const RATE_LIMIT = parseInt(Deno.env.get('RATE_LIMIT') ?? '100');
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitData {
  count: number;
  reset: number;
}

const kv = await Deno.openKv();

export function getRateLimitId(req: Request, body?: { userId?: string }) {
  if (body?.userId) return `user:${body.userId}`;
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';
  return `ip:${ip}`;
}

async function increment(id: string): Promise<RateLimitData> {
  const key = ['rate_limit', id];
  const now = Date.now();
  const res = await kv.get<RateLimitData>(key);
  let data = res.value;

  if (!data || data.reset < now) {
    data = { count: 1, reset: now + WINDOW_MS };
  } else {
    data.count += 1;
  }

  await kv.set(key, data);
  return data;
}

export async function enforceRateLimit(
  identifier: string,
  corsHeaders?: Record<string, string>
): Promise<Response | void> {
  const data = await increment(identifier);

  if (data.count > RATE_LIMIT) {
    log(`Rate limit exceeded for ${identifier}`);
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
