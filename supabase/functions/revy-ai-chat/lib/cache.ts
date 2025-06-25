
// Functions here expect a Supabase client passed in from the caller

export const getRequestHash = async (payload: object): Promise<string> => {
  const sortedPayload = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null).sort());
  const requestString = JSON.stringify(sortedPayload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(requestString));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export async function getCachedResponse(supabase: any, cacheKey: string, userId?: string) {
  if (!userId) return null;
  
  try {
    const requestHash = await getRequestHash(JSON.parse(cacheKey));
    
    const { data, error } = await supabase
      .from('ai_cache')
      .select('response, request_hash')
      .eq('request_hash', requestHash)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    // Increment hit counter
    await supabase.rpc('increment_cache_hit', { hash_to_update: requestHash });

    return {
      response: data.response,
      requestHash: data.request_hash
    };
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

export async function cacheResponse(
  supabase: any,
  cacheKey: string,
  response: string,
  userId: string,
  clientId?: string,
  model?: string
) {
  try {
    const requestHash = await getRequestHash(JSON.parse(cacheKey));
    
    const { error } = await supabase
      .from('ai_cache')
      .insert({
        request_hash: requestHash,
        response,
        user_id: userId,
        client_id: clientId,
        model,
        hits: 1,
        created_at: new Date().toISOString(),
        last_hit_at: new Date().toISOString()
      });

    if (error) {
      console.error('Cache storage error:', error);
    }
  } catch (error) {
    console.error('Cache storage error:', error);
  }
}
