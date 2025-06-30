export function handleBrregError(status: number, corsHeaders: Record<string, string>, query?: string): Response | null {
  if (status === 401 || status === 403) {
    return new Response(
      JSON.stringify({
        error: 'Authentication error with Brønnøysund API',
        status,
        message: 'Authentication failed or access was forbidden. Verify your Brønnøysund API credentials or contact support.'
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (status === 429) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        status,
        message: 'The Brønnøysund API rate limit has been exceeded. Wait before retrying or reduce request frequency.'
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (status === 404) {
    const message = query
      ? `No organization found with organization number: ${query}. Double-check the number or try a name search.`
      : 'Requested resource was not found.';
    return new Response(
      JSON.stringify({
        error: 'Organization not found',
        status: 404,
        message
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return null;
}
