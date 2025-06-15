
export const getRequestHash = async (payload: object): Promise<string> => {
  const sortedPayload = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null).sort());
  const requestString = JSON.stringify(sortedPayload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(requestString));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};
