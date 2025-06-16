
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function isOptions(req: Request): boolean {
  return req.method === 'OPTIONS';
}

export function handleCors(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
