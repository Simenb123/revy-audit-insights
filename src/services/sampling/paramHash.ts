// Stable parameter hash function for deterministic caching
// Creates canonical JSON representation and simple hash

export function paramHash(obj: unknown): string {
  const canonical = (o: any): any => {
    if (Array.isArray(o)) return o.map(canonical);
    if (o && typeof o === 'object') {
      return Object.keys(o).sort().reduce((acc, k) => { 
        acc[k] = canonical(o[k]); 
        return acc; 
      }, {} as any);
    }
    return o;
  };
  
  const s = JSON.stringify(canonical(obj));
  let h = 0; 
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `p${Math.abs(h)}`;
}